"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Search,
    Plus,
    Pencil,
    Trash2,
    User as UserIcon,
    Loader2,
    TrendingDown,
    TrendingUp,
    Minus,
    X,
    Check,
    AlertTriangle,
    Flame,
    Trophy,
    Calendar,
    Users,
    ArrowLeft,
    CheckCircle2,
    Activity,
    Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { getMembers } from "@/app/actions/admin";
import {
    getChallengeCandidates,
    assignChallengeCandidate,
    removeChallengeCandidate,
    getPTMeasurements,
    addPTMeasurement,
    updatePTMeasurement,
    deletePTMeasurement,
    getNextDayNumber,
    type ChallengeType,
    type ChallengeCandidate,
    type PTMeasurement,
} from "@/app/actions/pt-measurements";

// ---------------------------------------------------------------------------
// Types & Helpers
// ---------------------------------------------------------------------------

type Member = {
    id: string;
    name: string;
    photo: string | null;
    enroll_no?: string | null;
    phone?: string | null;
    membership: { plan: string; status: string; end_date: string } | null;
};

type EditRow = {
    id: string | null; // null = new row
    day_number: number | string;
    weight_kg: number | string;
    bmi: number | string;
    body_fat_pct: number | string;
    measured_at: string;
};

function fmt(val: number | null | undefined, unit = ""): string {
    if (val === null || val === undefined || isNaN(Number(val))) return "—";
    return `${val}${unit}`;
}

function todayISO(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function deltaIcon(first: number | null | undefined, last: number | null | undefined) {
    if (first == null || last == null || first === last) return <Minus size={12} className="text-zinc-500" />;
    return last < first
        ? <TrendingDown size={12} className="text-green-400" />
        : <TrendingUp size={12} className="text-red-400" />;
}

function deltaText(first: number | null | undefined, last: number | null | undefined, unit = "") {
    if (first == null || last == null) return null;
    const diff = Number((last - first).toFixed(1));
    if (diff === 0) return <span className="text-xs text-zinc-500">No change</span>;
    const sign = diff > 0 ? "+" : "";
    const color = diff < 0 ? "text-green-400" : "text-red-400";
    return <span className={`text-xs font-semibold ${color}`}>{sign}{diff}{unit}</span>;
}

function validateRow(row: EditRow, maxDay: number): string | null {
    const day = Number(row.day_number);
    if (!row.day_number || isNaN(day) || day < 1 || !Number.isInteger(day)) {
        return "Day number must be a positive integer.";
    }
    if (day > maxDay) {
        return `Day number cannot exceed Day ${maxDay} for this challenge.`;
    }
    if (row.weight_kg !== "" && row.weight_kg !== null) {
        const w = Number(row.weight_kg);
        if (isNaN(w) || w <= 0 || w > 500) return "Weight must be between 0 and 500 kg.";
    }
    if (row.bmi !== "" && row.bmi !== null) {
        const b = Number(row.bmi);
        if (isNaN(b) || b <= 0 || b > 100) return "BMI must be between 0 and 100.";
    }
    if (row.body_fat_pct !== "" && row.body_fat_pct !== null) {
        const f = Number(row.body_fat_pct);
        if (isNaN(f) || f < 0 || f >= 100) return "Body fat must be between 0% and 99.9%.";
    }
    if (!row.measured_at) return "Measurement date is required.";
    return null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PTMeasurementsPage() {
    // Challenge Tab: 90_DAYS or 120_DAYS
    const [activeChallenge, setActiveChallenge] = useState<ChallengeType>("90_DAYS");

    // All Members list (for candidate assignment)
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);

    // Candidates in current challenge
    const [candidates, setCandidates] = useState<ChallengeCandidate[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState(true);
    const [candidateSearch, setCandidateSearch] = useState("");

    // Counts for both challenges
    const [count90, setCount90] = useState<number>(0);
    const [count120, setCount120] = useState<number>(0);

    // Selected Candidate for Measurement Tracking
    const [selectedCandidate, setSelectedCandidate] = useState<ChallengeCandidate | null>(null);
    const [measurements, setMeasurements] = useState<PTMeasurement[]>([]);
    const [measLoading, setMeasLoading] = useState(false);

    // Measurement Row editing state
    const [editingRow, setEditingRow] = useState<EditRow | null>(null);
    const [savingRow, setSavingRow] = useState(false);
    const [rowError, setRowError] = useState<string | null>(null);

    // Delete Measurement confirmation
    const [deletingMeasId, setDeletingMeasId] = useState<string | null>(null);
    const [deletingMeas, setDeletingMeas] = useState(false);

    // Assign Candidate Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignSearch, setAssignSearch] = useState("");
    const [selectedMemberToAssign, setSelectedMemberToAssign] = useState<Member | null>(null);
    const [assignStartDate, setAssignStartDate] = useState(todayISO());
    const [assignLoading, setAssignLoading] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);

    // Candidate removal confirmation
    const [removingCandidateId, setRemovingCandidateId] = useState<string | null>(null);
    const [removingCandidate, setRemovingCandidate] = useState(false);

    // Toast Notification
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const maxDays = activeChallenge === "90_DAYS" ? 90 : 120;
    const challengeTitle = activeChallenge === "90_DAYS" ? "90 Days Challenge" : "120 Days Challenge";

    // ---------------------------------------------------------------------------
    // Data Fetching
    // ---------------------------------------------------------------------------

    // Load all members once
    useEffect(() => {
        getMembers().then((res) => {
            if (res.success && res.data) {
                setAllMembers(res.data as unknown as Member[]);
            }
            setMembersLoading(false);
        });
    }, []);

    // Load candidates whenever active challenge changes
    const loadCandidates = useCallback(async (type: ChallengeType) => {
        setCandidatesLoading(true);
        const res = await getChallengeCandidates(type);
        if (res.success && res.data) {
            setCandidates(res.data);
            if (type === "90_DAYS") setCount90(res.data.length);
            if (type === "120_DAYS") setCount120(res.data.length);
        } else {
            setCandidates([]);
            if (res.error) showToast(res.error, "error");
        }
        setCandidatesLoading(false);
    }, []);

    // Refresh candidate counts for both tabs
    const refreshCounts = useCallback(async () => {
        const [res90, res120] = await Promise.all([
            getChallengeCandidates("90_DAYS"),
            getChallengeCandidates("120_DAYS"),
        ]);
        if (res90.success && res90.data) setCount90(res90.data.length);
        if (res120.success && res120.data) setCount120(res120.data.length);
    }, []);

    useEffect(() => {
        loadCandidates(activeChallenge);
        refreshCounts();
    }, [activeChallenge, loadCandidates, refreshCounts]);

    // Load measurements for selected candidate
    const loadMeasurements = useCallback(async (memberId: string) => {
        setMeasLoading(true);
        const res = await getPTMeasurements(memberId, activeChallenge);
        if (res.success && res.data) {
            setMeasurements(res.data);
        } else {
            setMeasurements([]);
            if (res.error) showToast(res.error, "error");
        }
        setMeasLoading(false);
    }, [activeChallenge]);

    // Switch challenge tab
    const handleSwitchChallenge = (type: ChallengeType) => {
        if (type === activeChallenge) return;
        setActiveChallenge(type);
        setSelectedCandidate(null);
        setMeasurements([]);
        setEditingRow(null);
        setRowError(null);
        setCandidateSearch("");
    };

    // Select candidate
    const handleSelectCandidate = (candidate: ChallengeCandidate) => {
        setSelectedCandidate(candidate);
        setEditingRow(null);
        setRowError(null);
        loadMeasurements(candidate.member_id);
    };

    // Filter candidates in current challenge
    const filteredCandidates = useMemo(() => {
        if (!candidateSearch.trim()) return candidates;
        const q = candidateSearch.toLowerCase().trim();
        return candidates.filter((c) => {
            const name = (c.member.name || "").toLowerCase();
            const enroll = (c.member.enroll_no || "").toLowerCase();
            return name.includes(q) || enroll.includes(q);
        });
    }, [candidates, candidateSearch]);

    // Assign candidate submit
    const handleAssignCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMemberToAssign) {
            setAssignError("Please select a member to assign.");
            return;
        }

        setAssignLoading(true);
        setAssignError(null);

        const res = await assignChallengeCandidate(
            selectedMemberToAssign.id,
            activeChallenge,
            assignStartDate
        );

        if (res.success) {
            showToast(`${selectedMemberToAssign.name} assigned to ${challengeTitle}!`);
            setIsAssignModalOpen(false);
            setSelectedMemberToAssign(null);
            setAssignSearch("");
            setAssignStartDate(todayISO());
            await loadCandidates(activeChallenge);
            await refreshCounts();
        } else {
            setAssignError(res.error || "Failed to assign candidate.");
        }
        setAssignLoading(false);
    };

    // Remove candidate submit
    const handleRemoveCandidate = async (candidateId: string) => {
        setRemovingCandidate(true);
        const res = await removeChallengeCandidate(candidateId);
        if (res.success) {
            showToast("Candidate removed from challenge.");
            setRemovingCandidateId(null);
            if (selectedCandidate?.id === candidateId) {
                setSelectedCandidate(null);
                setMeasurements([]);
            }
            await loadCandidates(activeChallenge);
            await refreshCounts();
        } else {
            showToast(res.error || "Failed to remove candidate.", "error");
        }
        setRemovingCandidate(false);
    };

    // Start adding new measurement row
    const startAddMeasurement = async () => {
        if (!selectedCandidate) return;
        const nextDay = await getNextDayNumber(selectedCandidate.member_id, activeChallenge);
        setEditingRow({
            id: null,
            day_number: nextDay,
            weight_kg: "",
            bmi: "",
            body_fat_pct: "",
            measured_at: todayISO(),
        });
        setRowError(null);
    };

    // Start editing an existing measurement row
    const startEditMeasurement = (m: PTMeasurement) => {
        setEditingRow({
            id: m.id,
            day_number: m.day_number,
            weight_kg: m.weight_kg ?? "",
            bmi: m.bmi ?? "",
            body_fat_pct: m.body_fat_pct ?? "",
            measured_at: m.measured_at,
        });
        setRowError(null);
    };

    // Cancel edit/add
    const cancelEdit = () => {
        setEditingRow(null);
        setRowError(null);
    };

    // Save measurement row
    const saveMeasurementRow = async () => {
        if (!editingRow || !selectedCandidate) return;

        const valErr = validateRow(editingRow, maxDays);
        if (valErr) {
            setRowError(valErr);
            return;
        }

        setSavingRow(true);
        setRowError(null);

        const dayNum = Number(editingRow.day_number);
        const weight = editingRow.weight_kg !== "" ? Number(editingRow.weight_kg) : null;
        const bmi = editingRow.bmi !== "" ? Number(editingRow.bmi) : null;
        const fat = editingRow.body_fat_pct !== "" ? Number(editingRow.body_fat_pct) : null;

        let res: { success: boolean; error?: string };
        if (editingRow.id === null) {
            res = await addPTMeasurement(
                selectedCandidate.member_id,
                dayNum,
                weight,
                bmi,
                fat,
                editingRow.measured_at,
                activeChallenge
            );
        } else {
            res = await updatePTMeasurement(
                editingRow.id,
                dayNum,
                weight,
                bmi,
                fat,
                editingRow.measured_at,
                activeChallenge
            );
        }

        if (res.success) {
            showToast(editingRow.id === null ? "Measurement recorded." : "Measurement updated.");
            setEditingRow(null);
            await loadMeasurements(selectedCandidate.member_id);
            // Refresh candidates to update latest day and date
            await loadCandidates(activeChallenge);
        } else {
            setRowError(res.error || "Failed to save measurement.");
        }
        setSavingRow(false);
    };

    // Delete measurement row
    const confirmDeleteMeasurement = async () => {
        if (!deletingMeasId || !selectedCandidate) return;
        setDeletingMeas(true);
        const res = await deletePTMeasurement(deletingMeasId);
        if (res.success) {
            showToast("Measurement deleted.");
            setDeletingMeasId(null);
            await loadMeasurements(selectedCandidate.member_id);
            await loadCandidates(activeChallenge);
        } else {
            showToast(res.error || "Failed to delete.", "error");
        }
        setDeletingMeas(false);
    };

    // Filter members for assignment modal
    const assignableMembers = useMemo(() => {
        if (!assignSearch.trim()) return allMembers.slice(0, 30);
        const q = assignSearch.toLowerCase().trim();
        return allMembers.filter((m) => {
            const name = (m.name || "").toLowerCase();
            const enroll = (m.enroll_no || "").toLowerCase();
            return name.includes(q) || enroll.includes(q);
        }).slice(0, 30);
    }, [allMembers, assignSearch]);

    // Progress calculations for selected candidate
    const firstMeas = measurements.length > 0 ? measurements[0] : null;
    const latestMeas = measurements.length > 0 ? measurements[measurements.length - 1] : null;
    const hasMultipleMeas = measurements.length > 1;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                    <Activity className="h-8 w-8 text-[#E50914]" />
                    PT Body Measurements
                </h1>
                <p className="text-zinc-400 mt-1">
                    Track Fitelo body measurements across 90-day and 120-day Personal Training challenges.
                </p>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div
                    className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-bottom-4 ${
                        toast.type === "success"
                            ? "bg-zinc-900 border-green-500/40 text-green-400 shadow-green-500/10"
                            : "bg-zinc-900 border-red-500/40 text-red-400 shadow-red-500/10"
                    }`}
                >
                    {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Top Challenge Selection Tabs / Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 90 Days Challenge Tab */}
                <div
                    onClick={() => handleSwitchChallenge("90_DAYS")}
                    className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                        activeChallenge === "90_DAYS"
                            ? "bg-gradient-to-br from-[#E50914]/15 via-zinc-900 to-zinc-900 border-[#E50914] shadow-[0_0_20px_-5px_#E50914]"
                            : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    activeChallenge === "90_DAYS"
                                        ? "bg-[#E50914] text-white shadow-lg shadow-[#E50914]/40"
                                        : "bg-zinc-800 text-zinc-400"
                                }`}
                            >
                                <Flame size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-white tracking-wide">
                                        90 DAYS CHALLENGE
                                    </h2>
                                    {activeChallenge === "90_DAYS" && (
                                        <span className="text-[10px] font-bold uppercase bg-[#E50914] text-white px-2 py-0.5 rounded-full">
                                            Active Tab
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    3-Month intensive Personal Training transformation
                                </p>
                            </div>
                        </div>

                        <div className="text-right pl-4">
                            <span className="text-2xl font-bold text-white font-mono">{count90}</span>
                            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                                Candidates
                            </p>
                        </div>
                    </div>
                </div>

                {/* 120 Days Challenge Tab */}
                <div
                    onClick={() => handleSwitchChallenge("120_DAYS")}
                    className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                        activeChallenge === "120_DAYS"
                            ? "bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-900 border-amber-500 shadow-[0_0_20px_-5px_rgba(245,158,11,0.4)]"
                            : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                    activeChallenge === "120_DAYS"
                                        ? "bg-amber-500 text-black shadow-lg shadow-amber-500/40"
                                        : "bg-zinc-800 text-zinc-400"
                                }`}
                            >
                                <Trophy size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-white tracking-wide">
                                        120 DAYS CHALLENGE
                                    </h2>
                                    {activeChallenge === "120_DAYS" && (
                                        <span className="text-[10px] font-bold uppercase bg-amber-500 text-black px-2 py-0.5 rounded-full">
                                            Active Tab
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    4-Month elite Personal Training transformation
                                </p>
                            </div>
                        </div>

                        <div className="text-right pl-4">
                            <span className="text-2xl font-bold text-white font-mono">{count120}</span>
                            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                                Candidates
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidate Management Section */}
            {!selectedCandidate ? (
                <div className="space-y-4">
                    {/* Overview & Action Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/70 border border-zinc-800 p-4 rounded-xl">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {challengeTitle} Candidates
                                <span className="text-xs font-normal text-zinc-400">
                                    ({candidates.length} enrolled)
                                </span>
                            </h3>
                            <p className="text-xs text-zinc-400 mt-0.5">
                                Select a candidate to record and view their measurement history from Day 1 to Day {maxDays}.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Candidate Search */}
                            <div className="relative min-w-[200px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="text"
                                    placeholder="Search candidate..."
                                    value={candidateSearch}
                                    onChange={(e) => setCandidateSearch(e.target.value)}
                                    className="pl-9 bg-zinc-800/80 border-zinc-700 text-white text-sm h-9"
                                />
                            </div>

                            {/* Assign Candidate Button */}
                            <Button
                                onClick={() => {
                                    setIsAssignModalOpen(true);
                                    setSelectedMemberToAssign(null);
                                    setAssignSearch("");
                                    setAssignError(null);
                                    setAssignStartDate(todayISO());
                                }}
                                className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-semibold text-xs h-9 shadow-md shadow-[#E50914]/20 shrink-0"
                            >
                                <Plus size={16} className="mr-1.5" /> Assign PT Candidate
                            </Button>
                        </div>
                    </div>

                    {/* Candidates List / Grid */}
                    {candidatesLoading ? (
                        <div className="flex items-center justify-center py-20 text-zinc-500 gap-2">
                            <Loader2 size={20} className="animate-spin text-[#E50914]" />
                            <span>Loading {challengeTitle} candidates...</span>
                        </div>
                    ) : filteredCandidates.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-12 text-center">
                            <Users className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
                            <h4 className="text-base font-semibold text-white">
                                {candidateSearch ? "No matching candidates found" : `No candidates in ${challengeTitle} yet`}
                            </h4>
                            <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                                {candidateSearch
                                    ? `No candidates found matching "${candidateSearch}".`
                                    : `Assign gym members to this ${challengeTitle} to record weighing scale & Fitelo measurements.`}
                            </p>
                            {!candidateSearch && (
                                <Button
                                    onClick={() => setIsAssignModalOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    className="mt-4 border-zinc-700 text-zinc-300 hover:text-white"
                                >
                                    <Plus size={14} className="mr-1.5" /> Assign First Candidate
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredCandidates.map((c) => {
                                const initial = (c.member.name || "M").charAt(0).toUpperCase();
                                const isRemoving = removingCandidateId === c.id;

                                return (
                                    <div
                                        key={c.id}
                                        className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 transition-all flex flex-col justify-between group hover:shadow-lg"
                                    >
                                        <div>
                                            {/* Candidate Top Row */}
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-11 h-11 rounded-full bg-zinc-800 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center">
                                                        {c.member.photo_url ? (
                                                            <img
                                                                src={c.member.photo_url}
                                                                alt={c.member.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-base font-bold text-zinc-400">
                                                                {initial}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-semibold text-white truncate text-sm">
                                                            {c.member.name}
                                                        </h4>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            {c.member.enroll_no ? (
                                                                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                                    #{c.member.enroll_no}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[11px] text-zinc-500">No Enroll #</span>
                                                            )}
                                                            {c.member.membership_plan && (
                                                                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                                    {c.member.membership_plan}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Remove Candidate Button */}
                                                {isRemoving ? (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleRemoveCandidate(c.id)}
                                                            disabled={removingCandidate}
                                                            className="p-1 text-xs text-red-400 hover:bg-red-500/20 rounded"
                                                            title="Confirm remove"
                                                        >
                                                            {removingCandidate ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />}
                                                        </button>
                                                        <button
                                                            onClick={() => setRemovingCandidateId(null)}
                                                            className="p-1 text-xs text-zinc-400 hover:bg-zinc-800 rounded"
                                                            title="Cancel"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setRemovingCandidateId(c.id)}
                                                        className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remove candidate from challenge"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Candidate Challenge Stats */}
                                            <div className="grid grid-cols-2 gap-2 text-xs bg-black/40 p-2.5 rounded-lg border border-white/5 my-2">
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                                                        Challenge Start
                                                    </span>
                                                    <span className="text-zinc-300 font-medium font-mono text-[11px]">
                                                        {c.start_date
                                                            ? new Date(c.start_date + "T00:00:00").toLocaleDateString("en-GB")
                                                            : "—"}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                                                        Latest Reading
                                                    </span>
                                                    <span className="text-white font-semibold text-[11px]">
                                                        {c.latest_day ? `Day ${c.latest_day}` : "No readings yet"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 pt-1">
                                                <span>
                                                    Latest:{" "}
                                                    <strong className="text-zinc-400 font-normal">
                                                        {c.latest_measurement_date
                                                            ? new Date(c.latest_measurement_date + "T00:00:00").toLocaleDateString("en-GB")
                                                            : "—"}
                                                    </strong>
                                                </span>
                                                <span>
                                                    {c.total_measurements || 0} reading{c.total_measurements === 1 ? "" : "s"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action: Open Measurement Tracker */}
                                        <Button
                                            onClick={() => handleSelectCandidate(c)}
                                            className="w-full mt-3 bg-zinc-800 hover:bg-[#E50914] text-white text-xs h-8 font-medium transition-colors"
                                        >
                                            View & Record Measurements
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* Selected Candidate View: Progress Summary & Excel Table */
                <div className="space-y-6">
                    {/* Back / Navigation Bar */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedCandidate(null);
                                setMeasurements([]);
                                setEditingRow(null);
                            }}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} /> Back to {challengeTitle} Candidates
                        </Button>

                        <div className="text-xs text-zinc-500">
                            Challenge limit: <span className="text-zinc-300 font-semibold">Day 1 to Day {maxDays}</span>
                        </div>
                    </div>

                    {/* Candidate Identity & Progress Summary Card */}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                        {/* Top: Profile Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shrink-0 flex items-center justify-center">
                                    {selectedCandidate.member.photo_url ? (
                                        <img
                                            src={selectedCandidate.member.photo_url}
                                            alt={selectedCandidate.member.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon size={22} className="text-zinc-400" />
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-white">
                                            {selectedCandidate.member.name}
                                        </h2>
                                        {selectedCandidate.member.enroll_no && (
                                            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                                                #{selectedCandidate.member.enroll_no}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                                        <span className="text-amber-400 font-semibold">{challengeTitle}</span>
                                        <span>·</span>
                                        <span>
                                            Enrolled:{" "}
                                            {selectedCandidate.start_date
                                                ? new Date(selectedCandidate.start_date + "T00:00:00").toLocaleDateString("en-GB")
                                                : "—"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 sm:text-right">
                                <div>
                                    <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">
                                        Progress
                                    </span>
                                    <span className="text-sm font-bold text-white font-mono">
                                        {latestMeas ? `Day ${latestMeas.day_number} of ${maxDays}` : "Not started"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Comparison Counters (Only shown when required measurements exist) */}
                        {measurements.length === 0 ? (
                            <div className="py-6 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                                <Info size={14} className="text-zinc-600" />
                                <span>No measurements recorded yet. Add Day 1 below to establish baseline.</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3 pt-4 text-center">
                                {/* Weight */}
                                <div className="bg-black/50 rounded-xl p-3 border border-white/5">
                                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                                        Weight (kg)
                                    </span>
                                    <div className="text-base font-bold text-white font-mono">
                                        {fmt(latestMeas?.weight_kg, " kg")}
                                    </div>
                                    {hasMultipleMeas && firstMeas?.weight_kg && latestMeas?.weight_kg && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            {deltaIcon(firstMeas.weight_kg, latestMeas.weight_kg)}
                                            {deltaText(firstMeas.weight_kg, latestMeas.weight_kg, " kg")}
                                        </div>
                                    )}
                                    <div className="text-[10px] text-zinc-500 mt-1">
                                        Baseline: {fmt(firstMeas?.weight_kg, " kg")}
                                    </div>
                                </div>

                                {/* BMI */}
                                <div className="bg-black/50 rounded-xl p-3 border border-white/5">
                                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                                        BMI
                                    </span>
                                    <div className="text-base font-bold text-white font-mono">
                                        {fmt(latestMeas?.bmi)}
                                    </div>
                                    {hasMultipleMeas && firstMeas?.bmi && latestMeas?.bmi && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            {deltaIcon(firstMeas.bmi, latestMeas.bmi)}
                                            {deltaText(firstMeas.bmi, latestMeas.bmi)}
                                        </div>
                                    )}
                                    <div className="text-[10px] text-zinc-500 mt-1">
                                        Baseline: {fmt(firstMeas?.bmi)}
                                    </div>
                                </div>

                                {/* Body Fat */}
                                <div className="bg-black/50 rounded-xl p-3 border border-white/5">
                                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                                        Body Fat (%)
                                    </span>
                                    <div className="text-base font-bold text-white font-mono">
                                        {fmt(latestMeas?.body_fat_pct, "%")}
                                    </div>
                                    {hasMultipleMeas && firstMeas?.body_fat_pct && latestMeas?.body_fat_pct && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            {deltaIcon(firstMeas.body_fat_pct, latestMeas.body_fat_pct)}
                                            {deltaText(firstMeas.body_fat_pct, latestMeas.body_fat_pct, "%")}
                                        </div>
                                    )}
                                    <div className="text-[10px] text-zinc-500 mt-1">
                                        Baseline: {fmt(firstMeas?.body_fat_pct, "%")}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Excel-Style Measurement Table Card */}
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 bg-zinc-900/70 border-b border-zinc-800">
                            <div>
                                <CardTitle className="text-white text-base">
                                    Measurement History
                                    {measurements.length > 0 && (
                                        <span className="ml-2 text-xs font-normal text-zinc-500">
                                            ({measurements.length} record{measurements.length === 1 ? "" : "s"})
                                        </span>
                                    )}
                                </CardTitle>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    Readings entered from weighing scale & Fitelo
                                </p>
                            </div>

                            {/* Add Measurement Button */}
                            {editingRow?.id === null ? null : (
                                <Button
                                    onClick={startAddMeasurement}
                                    size="sm"
                                    className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-semibold text-xs h-8 shadow-md shadow-[#E50914]/20"
                                    disabled={!!editingRow}
                                >
                                    <Plus size={14} className="mr-1" /> Add Measurement
                                </Button>
                            )}
                        </CardHeader>

                        <CardContent className="p-0">
                            {measLoading ? (
                                <div className="flex items-center justify-center py-16 gap-2 text-zinc-500">
                                    <Loader2 size={18} className="animate-spin text-[#E50914]" />
                                    <span>Loading measurements...</span>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse min-w-[680px]">
                                        <thead>
                                            <tr className="border-b border-zinc-800 bg-zinc-900/90 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                                <th className="text-left px-4 py-3 w-24">Reg. No.</th>
                                                <th className="text-left px-4 py-3">Name</th>
                                                <th className="text-left px-4 py-3 w-28">Day</th>
                                                <th className="text-left px-4 py-3 w-32">Weight (kg)</th>
                                                <th className="text-left px-4 py-3 w-28">BMI</th>
                                                <th className="text-left px-4 py-3 w-32">Body Fat (%)</th>
                                                <th className="text-left px-4 py-3 w-32">Date</th>
                                                <th className="text-right px-4 py-3 w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/60">
                                            {/* Existing Rows */}
                                            {measurements.map((m, idx) => {
                                                const isFirst = idx === 0;
                                                const isLatest = idx === measurements.length - 1 && measurements.length > 1;
                                                const isEditing = editingRow?.id === m.id;

                                                if (isEditing && editingRow) {
                                                    return (
                                                        <EditableRow
                                                            key={m.id}
                                                            row={editingRow}
                                                            maxDay={maxDays}
                                                            candidate={selectedCandidate}
                                                            onChange={setEditingRow}
                                                            onSave={saveMeasurementRow}
                                                            onCancel={cancelEdit}
                                                            saving={savingRow}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <tr
                                                        key={m.id}
                                                        className={`hover:bg-zinc-800/40 transition-colors ${
                                                            isFirst && measurements.length > 1 ? "bg-blue-500/[0.03]" : ""
                                                        } ${isLatest ? "bg-green-500/[0.04]" : ""}`}
                                                    >
                                                        {/* Reg. No */}
                                                        <td className="px-4 py-3 text-zinc-300 font-mono text-xs">
                                                            {selectedCandidate.member.enroll_no
                                                                ? `#${selectedCandidate.member.enroll_no}`
                                                                : "—"}
                                                        </td>

                                                        {/* Name */}
                                                        <td className="px-4 py-3 text-white font-medium">
                                                            <div className="flex items-center gap-2">
                                                                <span>{selectedCandidate.member.name}</span>
                                                            </div>
                                                        </td>

                                                        {/* Day */}
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-bold text-white font-mono">
                                                                    Day {m.day_number}
                                                                </span>
                                                                {isFirst && measurements.length > 1 && (
                                                                    <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded-full">
                                                                        Initial
                                                                    </span>
                                                                )}
                                                                {isLatest && (
                                                                    <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 py-0.2 rounded-full">
                                                                        Latest
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Weight */}
                                                        <td className="px-4 py-3 text-zinc-200 font-mono">
                                                            {fmt(m.weight_kg, " kg")}
                                                        </td>

                                                        {/* BMI */}
                                                        <td className="px-4 py-3 text-zinc-200 font-mono">
                                                            {fmt(m.bmi)}
                                                        </td>

                                                        {/* Body Fat */}
                                                        <td className="px-4 py-3 text-zinc-200 font-mono">
                                                            {fmt(m.body_fat_pct, "%")}
                                                        </td>

                                                        {/* Date */}
                                                        <td className="px-4 py-3 text-zinc-400 text-xs font-mono">
                                                            {m.measured_at
                                                                ? new Date(m.measured_at + "T00:00:00").toLocaleDateString("en-GB")
                                                                : "—"}
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-3 text-right">
                                                            {deletingMeasId === m.id ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span className="text-[11px] text-zinc-400 mr-1">Delete?</span>
                                                                    <button
                                                                        onClick={confirmDeleteMeasurement}
                                                                        disabled={deletingMeas}
                                                                        className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                                                        title="Confirm"
                                                                    >
                                                                        {deletingMeas ? (
                                                                            <Loader2 size={12} className="animate-spin" />
                                                                        ) : (
                                                                            <Check size={13} />
                                                                        )}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingMeasId(null)}
                                                                        className="p-1 rounded text-zinc-400 hover:bg-zinc-700"
                                                                        title="Cancel"
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        onClick={() => startEditMeasurement(m)}
                                                                        disabled={!!editingRow}
                                                                        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors disabled:opacity-30"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingMeasId(m.id)}
                                                                        disabled={!!editingRow}
                                                                        className="p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}

                                            {/* New Inline Row */}
                                            {editingRow?.id === null && editingRow && (
                                                <EditableRow
                                                    row={editingRow}
                                                    maxDay={maxDays}
                                                    candidate={selectedCandidate}
                                                    onChange={setEditingRow}
                                                    onSave={saveMeasurementRow}
                                                    onCancel={cancelEdit}
                                                    saving={savingRow}
                                                    isNew
                                                />
                                            )}

                                            {/* Empty State */}
                                            {measurements.length === 0 && !editingRow && (
                                                <tr>
                                                    <td colSpan={8} className="py-16 text-center">
                                                        <div className="flex flex-col items-center justify-center text-zinc-500 gap-2">
                                                            <Activity size={32} className="text-zinc-700 mb-1" />
                                                            <p className="font-semibold text-zinc-400">
                                                                No measurements recorded yet
                                                            </p>
                                                            <p className="text-xs text-zinc-600 max-w-sm">
                                                                Click &quot;Add Measurement&quot; above to record Day 1 readings from the weighing scale or Fitelo.
                                                            </p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Row Error Banner */}
                                    {rowError && (
                                        <div className="m-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                                            <AlertTriangle size={14} className="shrink-0" />
                                            <span>{rowError}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Assign Candidate Modal */}
            <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
                <DialogContent className="bg-[#0A0A0A] border-zinc-800 text-white max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">
                            Assign Candidate to {challengeTitle}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAssignCandidate} className="space-y-4 pt-2">
                        {/* Member Search */}
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-300">Select PT Member</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                <Input
                                    type="text"
                                    placeholder="Search by name or enroll #..."
                                    value={assignSearch}
                                    onChange={(e) => {
                                        setAssignSearch(e.target.value);
                                        setSelectedMemberToAssign(null);
                                    }}
                                    className="pl-9 bg-zinc-900 border-zinc-800 text-sm text-white"
                                />
                            </div>

                            {/* Dropdown list of matching members */}
                            {!selectedMemberToAssign && (
                                <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/90 divide-y divide-zinc-800/60 mt-1">
                                    {membersLoading ? (
                                        <div className="p-3 text-center text-xs text-zinc-500">
                                            <Loader2 size={14} className="animate-spin inline mr-1" /> Loading members...
                                        </div>
                                    ) : assignableMembers.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-zinc-500">
                                            No matching members found
                                        </div>
                                    ) : (
                                        assignableMembers.map((m) => (
                                            <div
                                                key={m.id}
                                                onClick={() => {
                                                    setSelectedMemberToAssign(m);
                                                    setAssignSearch(m.name);
                                                }}
                                                className="p-2.5 flex items-center justify-between hover:bg-zinc-800 cursor-pointer transition-colors"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-zinc-800 overflow-hidden border border-white/10 shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400">
                                                        {m.photo ? (
                                                            <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            m.name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-medium text-white truncate block">
                                                            {m.name}
                                                        </span>
                                                        <span className="text-[11px] text-zinc-400 font-mono">
                                                            {m.enroll_no ? `#${m.enroll_no}` : "No enroll #"}
                                                        </span>
                                                    </div>
                                                </div>
                                                {m.membership?.plan && (
                                                    <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">
                                                        {m.membership.plan}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Member Preview */}
                        {selectedMemberToAssign && (
                            <div className="p-3 rounded-lg border border-green-500/30 bg-green-500/5 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                                    <div>
                                        <div className="text-sm font-bold text-white">
                                            {selectedMemberToAssign.name}
                                        </div>
                                        <div className="text-xs text-zinc-400 font-mono">
                                            Enroll: {selectedMemberToAssign.enroll_no ? `#${selectedMemberToAssign.enroll_no}` : "—"}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedMemberToAssign(null)}
                                    className="text-xs text-zinc-400 hover:text-white"
                                >
                                    Change
                                </Button>
                            </div>
                        )}

                        {/* Challenge Start Date */}
                        <div className="space-y-2">
                            <Label className="text-xs text-zinc-300">Challenge Start Date</Label>
                            <Input
                                type="date"
                                value={assignStartDate}
                                onChange={(e) => setAssignStartDate(e.target.value)}
                                required
                                className="bg-zinc-900 border-zinc-800 text-sm text-white"
                            />
                        </div>

                        {/* Assign Error */}
                        {assignError && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                                <AlertTriangle size={14} className="shrink-0" />
                                <span>{assignError}</span>
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsAssignModalOpen(false)}
                                className="border-zinc-800 text-zinc-300 hover:text-white text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={assignLoading || !selectedMemberToAssign}
                                className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-semibold text-xs"
                            >
                                {assignLoading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin mr-1.5" /> Assigning...
                                    </>
                                ) : (
                                    "Confirm Assignment"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Editable Row Sub-Component
// ---------------------------------------------------------------------------

function EditableRow({
    row,
    maxDay,
    candidate,
    onChange,
    onSave,
    onCancel,
    saving,
    isNew = false,
}: {
    row: EditRow;
    maxDay: number;
    candidate: ChallengeCandidate;
    onChange: (r: EditRow) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    isNew?: boolean;
}) {
    const cellCls = "px-4 py-2";
    const inputCls = "bg-zinc-800 border-zinc-700 text-white h-8 text-xs w-full focus:border-[#E50914]";

    return (
        <tr className={`border-b border-zinc-700 ${isNew ? "bg-[#E50914]/10" : "bg-blue-500/10"}`}>
            {/* Reg No */}
            <td className={cellCls}>
                <span className="text-zinc-300 font-mono text-xs">
                    {candidate.member.enroll_no ? `#${candidate.member.enroll_no}` : "—"}
                </span>
            </td>

            {/* Name */}
            <td className={cellCls}>
                <span className="text-white text-xs font-semibold">{candidate.member.name}</span>
            </td>

            {/* Program Day Input (Allowed: 1 to maxDay) */}
            <td className={cellCls}>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-zinc-400">Day</span>
                    <Input
                        type="number"
                        min={1}
                        max={maxDay}
                        step={1}
                        value={row.day_number}
                        onChange={(e) => onChange({ ...row, day_number: e.target.value })}
                        className={`${inputCls} w-20 font-mono`}
                        placeholder={`1-${maxDay}`}
                    />
                </div>
            </td>

            {/* Weight */}
            <td className={cellCls}>
                <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={row.weight_kg}
                    onChange={(e) => onChange({ ...row, weight_kg: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 72.5"
                />
            </td>

            {/* BMI */}
            <td className={cellCls}>
                <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={row.bmi}
                    onChange={(e) => onChange({ ...row, bmi: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 23.8"
                />
            </td>

            {/* Body Fat (%) */}
            <td className={cellCls}>
                <Input
                    type="number"
                    min={0}
                    max={99.9}
                    step={0.1}
                    value={row.body_fat_pct}
                    onChange={(e) => onChange({ ...row, body_fat_pct: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 18.5"
                />
            </td>

            {/* Measurement Date */}
            <td className={cellCls}>
                <Input
                    type="date"
                    value={row.measured_at}
                    onChange={(e) => onChange({ ...row, measured_at: e.target.value })}
                    className={inputCls}
                />
            </td>

            {/* Actions */}
            <td className={`${cellCls} text-right`}>
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="p-1.5 rounded bg-green-600/30 text-green-400 hover:bg-green-600/50 transition-colors disabled:opacity-50"
                        title="Save entry"
                    >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                    </button>
                    <button
                        onClick={onCancel}
                        disabled={saving}
                        className="p-1.5 rounded text-zinc-400 hover:bg-zinc-700 transition-colors disabled:opacity-50"
                        title="Cancel"
                    >
                        <X size={13} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

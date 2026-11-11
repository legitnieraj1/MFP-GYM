"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Plus, Pencil, Trash2, ChevronUp, ChevronDown, User as UserIcon, Loader2, TrendingDown, TrendingUp, Minus, X, Check, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getMembers } from "@/app/actions/admin";
import {
    getPTMeasurements,
    addPTMeasurement,
    updatePTMeasurement,
    deletePTMeasurement,
    getNextDayNumber,
    type PTMeasurement,
} from "@/app/actions/pt-measurements";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Member = {
    id: string;
    name: string;
    photo: string | null;
    enroll_no?: string | null;
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(val: number | null | undefined, unit = ""): string {
    if (val === null || val === undefined) return "—";
    return `${val}${unit}`;
}

function todayISO(): string {
    return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function deltaIcon(first: number | null | undefined, last: number | null | undefined) {
    if (first == null || last == null || first === last) return <Minus size={12} className="text-zinc-500" />;
    return last < first
        ? <TrendingDown size={12} className="text-green-400" />
        : <TrendingUp size={12} className="text-red-400" />;
}

function deltaText(first: number | null | undefined, last: number | null | undefined, unit = "") {
    if (first == null || last == null) return null;
    const diff = last - first;
    const sign = diff > 0 ? "+" : "";
    const color = unit === "" ? "text-zinc-400" : diff < 0 ? "text-green-400" : diff > 0 ? "text-red-400" : "text-zinc-400";
    return <span className={`text-xs ${color}`}>{sign}{diff.toFixed(1)}{unit}</span>;
}

function validateRow(row: EditRow): string | null {
    const day = Number(row.day_number);
    if (!row.day_number || isNaN(day) || day < 1 || !Number.isInteger(day)) return "Day number must be a positive integer.";
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
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({ measurements, member }: { measurements: PTMeasurement[]; member: Member }) {
    if (measurements.length === 0) return null;
    const first = measurements[0];
    const last = measurements[measurements.length - 1];
    const hasMultiple = measurements.length > 1;

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 mb-4">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-zinc-800">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 bg-zinc-800 flex-shrink-0">
                    {member.photo ? (
                        <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-zinc-400">
                            <UserIcon size={18} />
                        </div>
                    )}
                </div>
                <div>
                    <div className="font-semibold text-white">{member.name}</div>
                    {member.enroll_no && (
                        <div className="text-xs text-zinc-500">Reg. #{member.enroll_no}</div>
                    )}
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs text-zinc-500">{measurements.length} measurement{measurements.length !== 1 ? "s" : ""}</div>
                    <div className="text-xs text-zinc-600">Day 1 → Day {last.day_number}</div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
                {/* Weight */}
                <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Weight</div>
                    <div className="text-sm font-bold text-white">{fmt(last.weight_kg, " kg")}</div>
                    {hasMultiple && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                            {deltaIcon(first.weight_kg, last.weight_kg)}
                            {deltaText(first.weight_kg, last.weight_kg, " kg")}
                        </div>
                    )}
                    <div className="text-[10px] text-zinc-600 mt-0.5">Initial: {fmt(first.weight_kg, " kg")}</div>
                </div>
                {/* BMI */}
                <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">BMI</div>
                    <div className="text-sm font-bold text-white">{fmt(last.bmi)}</div>
                    {hasMultiple && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                            {deltaIcon(first.bmi, last.bmi)}
                            {deltaText(first.bmi, last.bmi)}
                        </div>
                    )}
                    <div className="text-[10px] text-zinc-600 mt-0.5">Initial: {fmt(first.bmi)}</div>
                </div>
                {/* Body Fat */}
                <div className="bg-black/40 rounded-lg p-2.5 border border-white/5">
                    <div className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1">Body Fat</div>
                    <div className="text-sm font-bold text-white">{fmt(last.body_fat_pct, "%")}</div>
                    {hasMultiple && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                            {deltaIcon(first.body_fat_pct, last.body_fat_pct)}
                            {deltaText(first.body_fat_pct, last.body_fat_pct, "%")}
                        </div>
                    )}
                    <div className="text-[10px] text-zinc-600 mt-0.5">Initial: {fmt(first.body_fat_pct, "%")}</div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function PTMeasurementsPage() {
    const [members, setMembers] = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);

    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [measurements, setMeasurements] = useState<PTMeasurement[]>([]);
    const [measLoading, setMeasLoading] = useState(false);

    // Inline edit / add row state
    const [editingRow, setEditingRow] = useState<EditRow | null>(null);
    const [savingRow, setSavingRow] = useState(false);
    const [rowError, setRowError] = useState<string | null>(null);

    // Delete confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Load all members once
    useEffect(() => {
        getMembers().then((res) => {
            if (res.success && res.data) {
                setMembers(res.data as unknown as Member[]);
            }
            setMembersLoading(false);
        });
    }, []);

    const loadMeasurements = useCallback(async (memberId: string) => {
        setMeasLoading(true);
        const res = await getPTMeasurements(memberId);
        if (res.success && res.data) {
            setMeasurements(res.data);
        } else {
            setMeasurements([]);
            if (res.error) showToast(res.error, "error");
        }
        setMeasLoading(false);
    }, []);

    const handleSelectMember = (member: Member) => {
        setSelectedMember(member);
        setSearch(member.name);
        setShowDropdown(false);
        setEditingRow(null);
        setRowError(null);
        loadMeasurements(member.id);
    };

    const filteredMembers = members.filter((m) => {
        const q = search.toLowerCase();
        return (
            m.name.toLowerCase().includes(q) ||
            (m.enroll_no && m.enroll_no.toLowerCase().includes(q))
        );
    });

    // Begin editing an existing row
    const startEdit = (m: PTMeasurement) => {
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

    // Begin adding a new row
    const startAdd = async () => {
        if (!selectedMember) return;
        const nextDay = await getNextDayNumber(selectedMember.id);
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

    // Cancel edit
    const cancelEdit = () => {
        setEditingRow(null);
        setRowError(null);
    };

    // Save row (add or update)
    const saveRow = async () => {
        if (!editingRow || !selectedMember) return;
        const validationError = validateRow(editingRow);
        if (validationError) {
            setRowError(validationError);
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
            res = await addPTMeasurement(selectedMember.id, dayNum, weight, bmi, fat, editingRow.measured_at);
        } else {
            res = await updatePTMeasurement(editingRow.id, dayNum, weight, bmi, fat, editingRow.measured_at);
        }

        if (res.success) {
            showToast(editingRow.id === null ? "Measurement added." : "Measurement updated.");
            setEditingRow(null);
            await loadMeasurements(selectedMember.id);
        } else {
            setRowError(res.error || "Failed to save.");
        }
        setSavingRow(false);
    };

    // Delete row
    const confirmDelete = async () => {
        if (!deletingId || !selectedMember) return;
        setDeleting(true);
        const res = await deletePTMeasurement(deletingId);
        if (res.success) {
            showToast("Measurement deleted.");
            setDeletingId(null);
            await loadMeasurements(selectedMember.id);
        } else {
            showToast(res.error || "Failed to delete.", "error");
        }
        setDeleting(false);
    };

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">PT Measurements</h1>
                <p className="text-muted-foreground">Track body measurements for Personal Training members.</p>
            </div>

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 transition-all ${
                    toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                }`}>
                    {toast.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Member search */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader className="pb-3">
                    <CardTitle className="text-white text-base">Select Member</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                            placeholder="Search by name or enroll number..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setShowDropdown(true);
                                if (!e.target.value) {
                                    setSelectedMember(null);
                                    setMeasurements([]);
                                }
                            }}
                            onFocus={() => setShowDropdown(true)}
                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                            className="pl-10 bg-zinc-800 border-zinc-700 text-white focus:border-[#E50914]"
                        />
                        {showDropdown && search.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl max-h-56 overflow-y-auto">
                                {membersLoading ? (
                                    <div className="p-3 text-zinc-500 text-sm flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" /> Loading members...
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="p-3 text-zinc-500 text-sm">No members found.</div>
                                ) : (
                                    filteredMembers.slice(0, 20).map((m) => (
                                        <button
                                            key={m.id}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800 transition-colors text-left"
                                            onMouseDown={() => handleSelectMember(m)}
                                        >
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-zinc-700 flex-shrink-0">
                                                {m.photo ? (
                                                    <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-xs font-bold text-zinc-400">
                                                        {m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium text-white truncate">{m.name}</div>
                                                {m.enroll_no && (
                                                    <div className="text-xs text-zinc-500">#{m.enroll_no}</div>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Measurements section */}
            {selectedMember && (
                <div>
                    {/* Summary */}
                    <SummaryCard measurements={measurements} member={selectedMember} />

                    {/* Table card */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <CardTitle className="text-white text-base">
                                Measurement History
                                {measurements.length > 0 && (
                                    <span className="ml-2 text-xs font-normal text-zinc-500">
                                        ({measurements.length} entr{measurements.length === 1 ? "y" : "ies"})
                                    </span>
                                )}
                            </CardTitle>
                            {editingRow?.id === null ? null : (
                                <Button
                                    onClick={startAdd}
                                    size="sm"
                                    className="bg-[#E50914] hover:bg-[#E50914]/90 text-white"
                                    disabled={!!editingRow}
                                >
                                    <Plus size={14} className="mr-1" /> Add Measurement
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="p-0">
                            {measLoading ? (
                                <div className="flex items-center justify-center py-12 gap-2 text-zinc-500">
                                    <Loader2 size={18} className="animate-spin" /> Loading...
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse min-w-[640px]">
                                        <thead>
                                            <tr className="border-b border-zinc-800 bg-zinc-900/80">
                                                <th className="text-left px-4 py-3 text-zinc-400 font-medium w-20">Reg. No.</th>
                                                <th className="text-left px-4 py-3 text-zinc-400 font-medium">Name</th>
                                                <th className="text-left px-4 py-3 text-zinc-400 font-medium w-24">Day</th>
                                                <th className="text-left px-4 py-3 text-zinc-400 font-medium w-32">Weight (kg)</th>
                                                <th className="text-left px-4 py-3 text-zinc-400 font-medium w-28">BMI</th>
                                                <th className="text-left px-4 py-3 text-zinc-400 font-medium w-32">Body Fat (%)</th>
                                                <th className="text-left px-4 py-3 text-zinc-400 font-medium w-32">Date</th>
                                                <th className="text-right px-4 py-3 text-zinc-400 font-medium w-24">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Existing rows */}
                                            {measurements.map((m, idx) => {
                                                const isFirst = idx === 0;
                                                const isLast = idx === measurements.length - 1 && measurements.length > 1;
                                                const isEditing = editingRow?.id === m.id;

                                                if (isEditing && editingRow) {
                                                    return (
                                                        <EditableRow
                                                            key={m.id}
                                                            row={editingRow}
                                                            member={selectedMember}
                                                            onChange={setEditingRow}
                                                            onSave={saveRow}
                                                            onCancel={cancelEdit}
                                                            saving={savingRow}
                                                            error={rowError}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <tr
                                                        key={m.id}
                                                        className={`border-b border-zinc-800/60 hover:bg-zinc-800/30 transition-colors ${
                                                            isFirst && measurements.length > 1 ? "bg-blue-500/5" : ""
                                                        } ${isLast ? "bg-green-500/5" : ""}`}
                                                    >
                                                        <td className="px-4 py-3 text-zinc-400 font-mono text-xs">
                                                            {selectedMember.enroll_no ? `#${selectedMember.enroll_no}` : "—"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-700 border border-white/10 flex-shrink-0">
                                                                    {selectedMember.photo ? (
                                                                        <img src={selectedMember.photo} alt={selectedMember.name} className="h-full w-full object-cover" />
                                                                    ) : (
                                                                        <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                                            {selectedMember.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <span className="text-white font-medium truncate max-w-[120px]">{selectedMember.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="font-semibold text-white">
                                                                Day {m.day_number}
                                                            </span>
                                                            {isFirst && measurements.length > 1 && (
                                                                <span className="ml-1.5 text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 rounded-full">Initial</span>
                                                            )}
                                                            {isLast && (
                                                                <span className="ml-1.5 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-1.5 rounded-full">Latest</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-zinc-300">{fmt(m.weight_kg, " kg")}</td>
                                                        <td className="px-4 py-3 text-zinc-300">{fmt(m.bmi)}</td>
                                                        <td className="px-4 py-3 text-zinc-300">{fmt(m.body_fat_pct, "%")}</td>
                                                        <td className="px-4 py-3 text-zinc-400 text-xs">
                                                            {m.measured_at ? new Date(m.measured_at + "T00:00:00").toLocaleDateString("en-GB") : "—"}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {deletingId === m.id ? (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <span className="text-xs text-zinc-400 mr-1">Delete?</span>
                                                                    <button
                                                                        onClick={confirmDelete}
                                                                        disabled={deleting}
                                                                        className="p-1.5 rounded text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                                        title="Confirm delete"
                                                                    >
                                                                        {deleting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingId(null)}
                                                                        className="p-1.5 rounded text-zinc-400 hover:bg-zinc-700 transition-colors"
                                                                        title="Cancel"
                                                                    >
                                                                        <X size={12} />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <button
                                                                        onClick={() => startEdit(m)}
                                                                        disabled={!!editingRow}
                                                                        className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil size={13} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeletingId(m.id)}
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

                                            {/* New row being added */}
                                            {editingRow?.id === null && editingRow && (
                                                <EditableRow
                                                    row={editingRow}
                                                    member={selectedMember}
                                                    onChange={setEditingRow}
                                                    onSave={saveRow}
                                                    onCancel={cancelEdit}
                                                    saving={savingRow}
                                                    error={rowError}
                                                    isNew
                                                />
                                            )}

                                            {/* Empty state */}
                                            {measurements.length === 0 && !editingRow && (
                                                <tr>
                                                    <td colSpan={8} className="py-16 text-center">
                                                        <div className="flex flex-col items-center gap-3 text-zinc-500">
                                                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                                                <ChevronUp size={20} />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">No measurements yet</p>
                                                                <p className="text-xs text-zinc-600 mt-1">Click &quot;Add Measurement&quot; to record the first entry.</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>

                                    {/* Row error */}
                                    {rowError && (
                                        <div className="mx-4 mb-3 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                                            <AlertTriangle size={12} />
                                            {rowError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* No member selected placeholder */}
            {!selectedMember && !membersLoading && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="py-16 text-center text-zinc-500">
                        <UserIcon size={40} className="mx-auto mb-3 text-zinc-700" />
                        <p className="font-medium">Search and select a member above</p>
                        <p className="text-xs text-zinc-600 mt-1">Their measurement history will appear here.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Editable Row component (used for both add and edit)
// ---------------------------------------------------------------------------

function EditableRow({
    row,
    member,
    onChange,
    onSave,
    onCancel,
    saving,
    error,
    isNew = false,
}: {
    row: EditRow;
    member: Member;
    onChange: (r: EditRow) => void;
    onSave: () => void;
    onCancel: () => void;
    saving: boolean;
    error: string | null;
    isNew?: boolean;
}) {
    const cellCls = "px-4 py-2";
    const inputCls = "bg-zinc-800 border-zinc-700 text-white h-8 text-sm w-full focus:border-[#E50914]";

    return (
        <tr className={`border-b border-zinc-700 ${isNew ? "bg-[#E50914]/5" : "bg-blue-500/5"}`}>
            <td className={cellCls}>
                <span className="text-zinc-400 font-mono text-xs">
                    {member.enroll_no ? `#${member.enroll_no}` : "—"}
                </span>
            </td>
            <td className={cellCls}>
                <span className="text-white text-sm font-medium">{member.name}</span>
            </td>
            <td className={cellCls}>
                <Input
                    type="number"
                    min={1}
                    step={1}
                    value={row.day_number}
                    onChange={(e) => onChange({ ...row, day_number: e.target.value })}
                    className={inputCls}
                    placeholder="Day #"
                />
            </td>
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
            <td className={cellCls}>
                <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={row.bmi}
                    onChange={(e) => onChange({ ...row, bmi: e.target.value })}
                    className={inputCls}
                    placeholder="e.g. 24.5"
                />
            </td>
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
            <td className={cellCls}>
                <Input
                    type="date"
                    value={row.measured_at}
                    onChange={(e) => onChange({ ...row, measured_at: e.target.value })}
                    className={inputCls}
                />
            </td>
            <td className={`${cellCls} text-right`}>
                <div className="flex items-center justify-end gap-1">
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="p-1.5 rounded bg-green-600/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        title="Save"
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


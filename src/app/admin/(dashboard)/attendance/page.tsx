"use client";

import { useEffect, useState, useMemo } from "react";
import { getTodaysLog } from "@/app/actions/attendance";
import { User, ArrowDownLeft, ArrowUpRight, Calendar, Clock, Search, RefreshCw, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function getTodayIST(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}

function formatISTDisplayDate(dateStr: string): string {
    try {
        const d = new Date(dateStr + "T00:00:00");
        return d.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return dateStr;
    }
}

export default function AttendancePage() {
    const [selectedDate, setSelectedDate] = useState<string>(getTodayIST());
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const fetchLogs = async (date: string) => {
        setLoading(true);
        try {
            const data = await getTodaysLog(date);
            setLogs(data || []);
        } catch (err) {
            console.error("Failed to load logs:", err);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(selectedDate);
    }, [selectedDate]);

    // Filter by search query (name or enroll_no)
    const filteredLogs = useMemo(() => {
        if (!searchQuery.trim()) return logs;
        const q = searchQuery.toLowerCase().trim();
        return logs.filter((log: any) => {
            const member = Array.isArray(log.member) ? log.member[0] : log.member;
            const name = (member?.name || "").toLowerCase();
            const enroll = (member?.enroll_no || "").toLowerCase();
            return name.includes(q) || enroll.includes(q);
        });
    }, [logs, searchQuery]);

    const activeCount = logs.filter((l) => !l.check_out_time).length;
    const completedCount = logs.filter((l) => l.check_out_time).length;

    const isToday = selectedDate === getTodayIST();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                        Today&apos;s Activity Log
                    </h1>
                    <p className="text-zinc-400 mt-1 flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-[#E50914]" />
                        {formatISTDisplayDate(selectedDate)}
                        {isToday && (
                            <span className="text-[11px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">
                                Live Today
                            </span>
                        )}
                    </p>
                </div>

                {/* KPI Counters */}
                <div className="flex gap-3">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <div className="bg-green-500/10 p-2 rounded-lg">
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">Active in Gym</p>
                            <p className="text-xl font-bold text-white leading-none mt-0.5">
                                {loading ? "—" : activeCount}
                            </p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-lg">
                            <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-wider">Completed</p>
                            <p className="text-xl font-bold text-white leading-none mt-0.5">
                                {loading ? "—" : completedCount}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Bar: Date Picker, Search & Refresh */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-zinc-900/60 border border-zinc-800 p-3 rounded-xl">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Selector */}
                    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-700 px-3 py-1.5 rounded-lg">
                        <Calendar className="h-4 w-4 text-zinc-400 shrink-0" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value || getTodayIST())}
                            className="bg-transparent text-white text-sm outline-none cursor-pointer"
                        />
                    </div>

                    {!isToday && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDate(getTodayIST())}
                            className="bg-zinc-800 border-zinc-700 text-xs text-zinc-300 hover:text-white"
                        >
                            Reset to Today
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchLogs(selectedDate)}
                        disabled={loading}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                        title="Refresh"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-[#E50914]" : ""}`} />
                    </Button>
                </div>

                {/* Search Box */}
                <div className="relative min-w-[220px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        type="text"
                        placeholder="Search member or enroll #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-zinc-900 border-zinc-700 text-white text-sm h-9"
                    />
                </div>
            </div>

            {/* Attendance Table */}
            <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse min-w-[620px]">
                        <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-900/70 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                <th className="text-left px-5 py-3.5">Member</th>
                                <th className="text-left px-5 py-3.5 w-36">Check In</th>
                                <th className="text-left px-5 py-3.5 w-36">Check Out</th>
                                <th className="text-right px-5 py-3.5 w-32">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#E50914]" />
                                            <span>Loading attendance logs...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-16 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Clock className="h-8 w-8 opacity-25" />
                                            <p className="font-medium">No activity recorded for this date</p>
                                            {searchQuery && (
                                                <p className="text-xs text-zinc-600">
                                                    No results matching &quot;{searchQuery}&quot;
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log: any) => {
                                    const member = Array.isArray(log.member) ? log.member[0] : log.member;
                                    const enrollNo = member?.enroll_no || member?.enrollment_number;
                                    const name = member?.name || "Unknown Member";
                                    const initial = name.charAt(0).toUpperCase();

                                    const checkInFormatted = new Date(log.check_in_time).toLocaleTimeString("en-US", {
                                        timeZone: "Asia/Kolkata",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                    });

                                    const checkOutFormatted = log.check_out_time
                                        ? new Date(log.check_out_time).toLocaleTimeString("en-US", {
                                              timeZone: "Asia/Kolkata",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                          })
                                        : "—";

                                    const isCompleted = Boolean(log.check_out_time);

                                    return (
                                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                                            {/* Member Column: Photo + Name + Enroll # */}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Avatar */}
                                                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                                                        {member?.photo_url ? (
                                                            <img
                                                                src={member.photo_url}
                                                                alt={name}
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => {
                                                                    const t = e.target as HTMLImageElement;
                                                                    t.style.display = "none";
                                                                    if (t.parentElement) {
                                                                        t.parentElement.innerHTML = `<div class="h-full w-full flex items-center justify-center text-sm font-bold text-zinc-400 bg-zinc-800">${initial}</div>`;
                                                                    }
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center text-sm font-bold text-zinc-300 bg-zinc-800">
                                                                {initial || <User className="h-4 w-4 text-zinc-500" />}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="min-w-0 flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-white truncate max-w-[220px]">
                                                                {name}
                                                            </span>
                                                            {enrollNo && (
                                                                <span className="shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/80">
                                                                    #{enrollNo}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-zinc-500 font-mono">
                                                            {isCompleted ? "Checked out" : "Currently in gym"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Check In */}
                                            <td className="px-5 py-3.5 text-zinc-300 font-mono text-sm">
                                                {checkInFormatted}
                                            </td>

                                            {/* Check Out */}
                                            <td className="px-5 py-3.5 text-zinc-300 font-mono text-sm">
                                                {checkOutFormatted}
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-3.5 text-right">
                                                {isCompleted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                                        Completed
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

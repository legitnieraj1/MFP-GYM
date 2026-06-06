"use client";

import { useEffect, useMemo, useState } from "react";
import {
    getAttendanceSummary,
    type AttendanceSummaryResult,
    type MemberAttendanceSummary,
} from "@/app/actions/attendance";
import {
    CalendarRange,
    Search,
    Users,
    Activity,
    Flame,
    ChevronDown,
    Loader2,
    User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const MONTHS_SHORT = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const NOW = new Date();
const CURRENT_YEAR = NOW.getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

function fmtDate(d: string | null) {
    if (!d) return "—";
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function AttendanceHistoryPage() {
    const [year, setYear] = useState(CURRENT_YEAR);
    // month: 1-12, or 0 = whole year
    const [month, setMonth] = useState<number>(NOW.getMonth() + 1);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AttendanceSummaryResult | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const isYearView = month === 0;

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getAttendanceSummary(year, isYearView ? null : month).then((res) => {
            if (!cancelled) {
                setData(res);
                setLoading(false);
                setExpanded(null);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [year, month, isYearView]);

    const filtered: MemberAttendanceSummary[] = useMemo(() => {
        if (!data?.members) return [];
        const q = query.trim().toLowerCase();
        if (!q) return data.members;
        return data.members.filter(
            (m) =>
                m.name.toLowerCase().includes(q) ||
                (m.enrollment || "").toLowerCase().includes(q)
        );
    }, [data, query]);

    const periodLabel = isYearView ? `${year}` : `${MONTHS[month - 1]} ${year}`;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="flex items-center gap-3 font-bebas text-4xl tracking-wide text-white">
                    <CalendarRange className="h-8 w-8 text-[#E50914]" />
                    Attendance Management
                </h1>
                <p className="text-zinc-400">
                    Attendance history across months and years — {periodLabel}
                </p>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Year */}
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:border-zinc-700 focus:border-[#E50914]"
                    >
                        {YEARS.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>

                    {/* Month */}
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white outline-none transition-colors hover:border-zinc-700 focus:border-[#E50914]"
                    >
                        <option value={0}>Whole Year</option>
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>
                                {m}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-80">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search member or enrollment no…"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-colors focus:border-[#E50914]"
                    />
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                    icon={<Users className="h-5 w-5 text-green-500" />}
                    tint="bg-green-500/10"
                    label="Members Attended"
                    value={loading ? "—" : String(data?.totals.uniqueMembers ?? 0)}
                />
                <StatCard
                    icon={<Activity className="h-5 w-5 text-blue-500" />}
                    tint="bg-blue-500/10"
                    label="Total Check-ins"
                    value={loading ? "—" : String(data?.totals.totalCheckIns ?? 0)}
                />
                <StatCard
                    icon={<Flame className="h-5 w-5 text-amber-500" />}
                    tint="bg-amber-500/10"
                    label="Busiest Day"
                    value={
                        loading
                            ? "—"
                            : data?.totals.busiestDate
                            ? `${fmtDate(data.totals.busiestDate)}`
                            : "—"
                    }
                    sub={
                        !loading && data?.totals.busiestCount
                            ? `${data.totals.busiestCount} check-ins`
                            : undefined
                    }
                />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0A0A0A]">
                {/* head */}
                <div
                    className={cn(
                        "grid gap-4 border-b border-zinc-800 p-4 text-xs font-bold uppercase tracking-wider text-zinc-500",
                        isYearView ? "grid-cols-12" : "grid-cols-12"
                    )}
                >
                    <div className="col-span-4">Member</div>
                    {isYearView ? (
                        <>
                            <div className="col-span-5 text-center">Monthly Activity</div>
                            <div className="col-span-2 text-center">Days</div>
                            <div className="col-span-1 text-right">Last</div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2 text-center">Days Attended</div>
                            <div className="col-span-2 text-center">Check-ins</div>
                            <div className="col-span-3 text-right">Last Visit</div>
                            <div className="col-span-1 text-right">·</div>
                        </>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-3 p-16 text-zinc-500">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading attendance…
                    </div>
                ) : !data?.success ? (
                    <div className="p-16 text-center text-red-500">
                        {data?.error || "Failed to load."}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-16 text-zinc-500">
                        <CalendarRange className="h-8 w-8 opacity-20" />
                        <p>No attendance records for {periodLabel}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {filtered.map((m, idx) =>
                            isYearView ? (
                                <YearRow key={m.userId} m={m} rank={idx + 1} />
                            ) : (
                                <MonthRow
                                    key={m.userId}
                                    m={m}
                                    rank={idx + 1}
                                    open={expanded === m.userId}
                                    onToggle={() =>
                                        setExpanded(expanded === m.userId ? null : m.userId)
                                    }
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    icon,
    tint,
    label,
    value,
    sub,
}: {
    icon: React.ReactNode;
    tint: string;
    label: string;
    value: string;
    sub?: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
            <div className={cn("rounded-full p-3", tint)}>{icon}</div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {label}
                </p>
                <p className="text-2xl font-bold leading-tight text-white">{value}</p>
                {sub && <p className="text-xs text-zinc-500">{sub}</p>}
            </div>
        </div>
    );
}

function MemberCell({ m, rank }: { m: MemberAttendanceSummary; rank: number }) {
    return (
        <div className="col-span-4 flex items-center gap-3">
            <span className="w-5 text-right text-xs font-bold text-zinc-600">{rank}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
                <User className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="min-w-0">
                <p className="truncate font-medium text-white">{m.name}</p>
                {m.enrollment && (
                    <p className="truncate text-xs text-zinc-500">#{m.enrollment}</p>
                )}
            </div>
        </div>
    );
}

function MonthRow({
    m,
    rank,
    open,
    onToggle,
}: {
    m: MemberAttendanceSummary;
    rank: number;
    open: boolean;
    onToggle: () => void;
}) {
    return (
        <div>
            <button
                onClick={onToggle}
                className="grid w-full grid-cols-12 items-center gap-4 p-4 text-left transition-colors hover:bg-white/5"
            >
                <MemberCell m={m} rank={rank} />
                <div className="col-span-2 text-center">
                    <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-sm font-bold text-green-400">
                        {m.daysAttended}
                    </span>
                </div>
                <div className="col-span-2 text-center font-mono text-sm text-zinc-300">
                    {m.totalCheckIns}
                </div>
                <div className="col-span-3 text-right font-mono text-sm text-zinc-400">
                    {fmtDate(m.lastVisit)}
                </div>
                <div className="col-span-1 flex justify-end">
                    <ChevronDown
                        className={cn(
                            "h-4 w-4 text-zinc-500 transition-transform",
                            open && "rotate-180"
                        )}
                    />
                </div>
            </button>
            {open && (
                <div className="border-t border-zinc-800/50 bg-black/40 p-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">
                        Days present ({m.dates.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {m.dates.map((d) => (
                            <span
                                key={d}
                                className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 font-mono text-xs text-zinc-300"
                            >
                                {fmtDate(d)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function YearRow({ m, rank }: { m: MemberAttendanceSummary; rank: number }) {
    const max = Math.max(...m.monthly, 1);
    return (
        <div className="grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-white/5">
            <MemberCell m={m} rank={rank} />
            {/* monthly mini bars */}
            <div className="col-span-5">
                <div className="flex items-end justify-between gap-1">
                    {m.monthly.map((c, i) => (
                        <div
                            key={i}
                            className="group flex flex-1 flex-col items-center gap-1"
                            title={`${MONTHS[i]}: ${c} day${c === 1 ? "" : "s"}`}
                        >
                            <div className="flex h-10 w-full items-end">
                                <div
                                    className={cn(
                                        "w-full rounded-sm transition-all",
                                        c > 0 ? "bg-[#E50914]" : "bg-zinc-800"
                                    )}
                                    style={{
                                        height: c > 0 ? `${Math.max(15, (c / max) * 100)}%` : "4px",
                                    }}
                                />
                            </div>
                            <span className="text-[9px] text-zinc-600">{MONTHS_SHORT[i]}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="col-span-2 text-center">
                <span className="inline-flex min-w-[2.5rem] items-center justify-center rounded-full bg-green-500/10 px-2.5 py-0.5 text-sm font-bold text-green-400">
                    {m.daysAttended}
                </span>
            </div>
            <div className="col-span-1 text-right font-mono text-xs text-zinc-400">
                {m.lastVisit ? fmtDate(m.lastVisit).slice(0, 6) : "—"}
            </div>
        </div>
    );
}

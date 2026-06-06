"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

// Minutes after check-in during which another tap is treated as an accidental
// double-tap (keeps the member checked in) rather than a check-out.
const CHECKOUT_COOLDOWN_MINUTES = 15;

// Gym timezone. The `date` column MUST be derived from this, not from UTC —
// otherwise the UTC day rolls over at 05:30 IST and splits an early-morning
// visit across two "days", making check-out look like a fresh check-in.
const GYM_TZ = 'Asia/Kolkata';

function istDate(): string {
    // en-CA formats as YYYY-MM-DD
    return new Date().toLocaleDateString('en-CA', { timeZone: GYM_TZ });
}

function istTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', {
        timeZone: GYM_TZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });
}

export async function markAttendance() {
    if (!supabaseAdmin) {
        return { success: false, error: "Server configuration error" };
    }

    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Not authenticated" };
    }
    const userId = session.userId;

    try {
        const today = istDate();
        const nowISO = new Date().toISOString();

        const [attendanceResult, profileResult] = await Promise.all([
            supabaseAdmin
                .from('attendance')
                .select('id, check_in_time, check_out_time')
                .eq('user_id', userId)
                .eq('date', today)
                .maybeSingle(),
            supabaseAdmin
                .from('members')
                .select('name')
                .eq('id', userId)
                .single(),
        ]);

        const name = profileResult.data?.name || "Member";

        // maybeSingle throws PGRST116 only when >1 row matches (legacy duplicate
        // rows from the old race condition). Treat that as "already checked in"
        // instead of a hard error — the unique index migration prevents new dups.
        if (attendanceResult.error && attendanceResult.error.code !== 'PGRST116') {
            console.error("Fetch error:", attendanceResult.error);
        }

        const existingRecord = attendanceResult.data;

        if (existingRecord) {
            if (!existingRecord.check_out_time) {
                // Currently checked in.
                const minsSinceCheckIn = existingRecord.check_in_time
                    ? (Date.now() - new Date(existingRecord.check_in_time).getTime()) / 60000
                    : Infinity;

                if (minsSinceCheckIn < CHECKOUT_COOLDOWN_MINUTES) {
                    // Accidental double-tap / re-scan right after check-in.
                    // Keep them checked in and show the check-in screen again.
                    return {
                        success: true,
                        status: 'CHECK_IN',
                        name,
                        time: istTime(existingRecord.check_in_time),
                    };
                }

                // Genuine check-out.
                const { error: updateError } = await supabaseAdmin
                    .from('attendance')
                    .update({ check_out_time: nowISO })
                    .eq('id', existingRecord.id);

                if (updateError) throw updateError;

                return { success: true, status: 'CHECK_OUT', name, time: istTime(nowISO) };
            }

            // Already checked out for today.
            return {
                success: true,
                status: 'ALREADY_COMPLETED',
                name,
                time: istTime(existingRecord.check_out_time),
            };
        }

        // No record yet → check in. Race-safe: a unique index on (user_id, date)
        // means a concurrent tap can never create a second row.
        const { error: insertError } = await supabaseAdmin
            .from('attendance')
            .insert({ user_id: userId, check_in_time: nowISO, date: today });

        if (insertError) {
            // 23505 = unique_violation → a simultaneous tap already checked them
            // in. Idempotent: report check-in using the existing row's time.
            if (insertError.code === '23505') {
                const { data: row } = await supabaseAdmin
                    .from('attendance')
                    .select('check_in_time')
                    .eq('user_id', userId)
                    .eq('date', today)
                    .maybeSingle();
                return {
                    success: true,
                    status: 'CHECK_IN',
                    name,
                    time: istTime(row?.check_in_time || nowISO),
                };
            }
            throw insertError;
        }

        return { success: true, status: 'CHECK_IN', name, time: istTime(nowISO) };
    } catch (error: any) {
        console.error("Attendance error:", error);
        return { success: false, error: error.message || "Failed to mark attendance" };
    }
}

// Helper to auto-checkout sessions older than 3 hours
export async function autoCheckoutOldSessions() {
    if (!supabaseAdmin) return;

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const today = istDate();

    try {
        const { data: staleSessions, error: fetchError } = await supabaseAdmin
            .from('attendance')
            .select('id, check_in_time')
            .eq('date', today)
            .is('check_out_time', null)
            .lt('check_in_time', threeHoursAgo.toISOString());

        if (fetchError) {
            console.error("Error fetching stale sessions:", fetchError);
            return;
        }

        if (staleSessions && staleSessions.length > 0) {
            console.log(`Auto-checking out ${staleSessions.length} stale sessions...`);

            for (const session of staleSessions) {
                const checkInTime = new Date(session.check_in_time);
                const autoCheckOutTime = new Date(checkInTime.getTime() + 3 * 60 * 60 * 1000);

                await supabaseAdmin
                    .from('attendance')
                    .update({ check_out_time: autoCheckOutTime.toISOString() })
                    .eq('id', session.id);
            }
        }
    } catch (error) {
        console.error("Auto-checkout error:", error);
    }
}

export async function getTodaysLog() {
    if (!supabaseAdmin) return [];

    // Trigger auto-checkout maintenance
    await autoCheckoutOldSessions();

    const today = istDate();

    const { data: logs, error } = await supabaseAdmin
        .from('attendance')
        .select(`
            *,
            member:members (
                name
            )
        `)
        .eq('date', today)
        .order('check_in_time', { ascending: false });

    if (error) {
        console.error("Fetch logs error:", error);
        return [];
    }

    return logs;
}

// ---------------------------------------------------------------------------
// Attendance history / management (admin)
// ---------------------------------------------------------------------------

export type MemberAttendanceSummary = {
    userId: string;
    name: string;
    enrollment: string | null;
    daysAttended: number;      // distinct days present in the period
    totalCheckIns: number;     // total attendance rows in the period
    lastVisit: string | null;  // YYYY-MM-DD of most recent visit
    monthly: number[];         // 12 buckets (Jan..Dec) of distinct days — used in year view
    dates: string[];           // sorted distinct YYYY-MM-DD list — used in month view detail
};

export type AttendanceSummaryResult = {
    success: boolean;
    error?: string;
    year: number;
    month: number | null;      // 1-12, or null for whole-year view
    members: MemberAttendanceSummary[];
    totals: {
        uniqueMembers: number;
        totalCheckIns: number;
        busiestDate: string | null;
        busiestCount: number;
    };
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Aggregated attendance for the admin Attendance Management page.
 * @param year  full year, e.g. 2026
 * @param month 1-12 for a single month, or null for the whole year
 */
export async function getAttendanceSummary(
    year: number,
    month: number | null
): Promise<AttendanceSummaryResult> {
    const empty: AttendanceSummaryResult = {
        success: false,
        year,
        month,
        members: [],
        totals: { uniqueMembers: 0, totalCheckIns: 0, busiestDate: null, busiestCount: 0 },
    };

    if (!supabaseAdmin) {
        return { ...empty, error: "Server configuration error" };
    }

    // Build [start, end) date range.
    let start: string;
    let end: string;
    if (month) {
        start = `${year}-${pad2(month)}-01`;
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        end = `${nextYear}-${pad2(nextMonth)}-01`;
    } else {
        start = `${year}-01-01`;
        end = `${year + 1}-01-01`;
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("attendance")
            .select(`
                user_id,
                date,
                member:members ( name, enroll_no )
            `)
            .gte("date", start)
            .lt("date", end)
            .order("date", { ascending: true });

        if (error) throw error;

        type MemberRel = { name: string | null; enroll_no: string | null };
        const rows = (data || []) as unknown as Array<{
            user_id: string;
            date: string;
            // Supabase types embedded relations as arrays even for to-one FKs.
            member: MemberRel | MemberRel[] | null;
        }>;
        const memberOf = (m: MemberRel | MemberRel[] | null): MemberRel | null =>
            Array.isArray(m) ? m[0] ?? null : m;

        const byMember = new Map<string, MemberAttendanceSummary>();
        const perDateCount = new Map<string, number>();

        for (const row of rows) {
            if (!row.user_id || !row.date) continue;

            perDateCount.set(row.date, (perDateCount.get(row.date) || 0) + 1);

            let m = byMember.get(row.user_id);
            if (!m) {
                const mem = memberOf(row.member);
                m = {
                    userId: row.user_id,
                    name: mem?.name || "Unknown",
                    enrollment: mem?.enroll_no ?? null,
                    daysAttended: 0,
                    totalCheckIns: 0,
                    lastVisit: null,
                    monthly: Array(12).fill(0),
                    dates: [],
                };
                byMember.set(row.user_id, m);
            }

            m.totalCheckIns += 1;
            // distinct days
            if (!m.dates.includes(row.date)) {
                m.dates.push(row.date);
                m.daysAttended += 1;
                const monthIdx = Number(row.date.slice(5, 7)) - 1; // 0-11
                if (monthIdx >= 0 && monthIdx < 12) m.monthly[monthIdx] += 1;
            }
            if (!m.lastVisit || row.date > m.lastVisit) m.lastVisit = row.date;
        }

        const members = Array.from(byMember.values()).sort(
            (a, b) => b.daysAttended - a.daysAttended || a.name.localeCompare(b.name)
        );

        let busiestDate: string | null = null;
        let busiestCount = 0;
        for (const [d, c] of perDateCount) {
            if (c > busiestCount) {
                busiestCount = c;
                busiestDate = d;
            }
        }

        return {
            success: true,
            year,
            month,
            members,
            totals: {
                uniqueMembers: members.length,
                totalCheckIns: rows.length,
                busiestDate,
                busiestCount,
            },
        };
    } catch (err: any) {
        console.error("getAttendanceSummary error:", err);
        return { ...empty, error: err.message || "Failed to load attendance history" };
    }
}

"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/auth";

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
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const nowISO = new Date().toISOString();
        const nowTime = new Date().toLocaleTimeString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });

        // Single query: fetch today's attendance record AND member name together
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

        if (attendanceResult.error && attendanceResult.error.code !== 'PGRST116') {
            console.error("Fetch error:", attendanceResult.error);
            return { success: false, error: "Failed to fetch attendance" };
        }

        const existingRecord = attendanceResult.data;
        const name = profileResult.data?.name;

        if (existingRecord) {
            if (!existingRecord.check_out_time) {
                // Checked in but not out → Check Out

                // Enforce 15-minute cooldown before checkout
                if (existingRecord.check_in_time) {
                    const checkInTime = new Date(existingRecord.check_in_time);
                    const now = new Date(nowISO);
                    const diffMinutes = (now.getTime() - checkInTime.getTime()) / (1000 * 60);

                    if (diffMinutes < 15) {
                        return { success: true, status: 'COOLDOWN', name, time: nowTime };
                    }
                }

                const { error: updateError } = await supabaseAdmin
                    .from('attendance')
                    .update({ check_out_time: nowISO })
                    .eq('id', existingRecord.id);

                if (updateError) throw updateError;

                return { success: true, status: 'CHECK_OUT', name, time: nowTime };
            } else {
                // Already fully done for today
                return { success: true, status: 'ALREADY_COMPLETED', name };
            }
        } else {
            // No record → Check In
            const { error: insertError } = await supabaseAdmin
                .from('attendance')
                .insert({ user_id: userId, check_in_time: nowISO, date: today });

            if (insertError) throw insertError;

            return { success: true, status: 'CHECK_IN', name, time: nowTime };
        }
    } catch (error: any) {
        console.error("Attendance error:", error);
        return { success: false, error: error.message || "Failed to mark attendance" };
    }
}

// Helper to auto-checkout sessions older than 3 hours
export async function autoCheckoutOldSessions() {
    if (!supabaseAdmin) return;

    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const today = new Date().toISOString().split('T')[0];

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

    const today = new Date().toISOString().split('T')[0];

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

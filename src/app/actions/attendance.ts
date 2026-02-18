"use server";

import { supabaseAdmin } from "@/lib/supabase";

import { getSession } from "@/lib/auth"; // Import custom session getter

export async function markAttendance() {
    if (!supabaseAdmin) {
        return { success: false, error: "Server configuration error" };
    }

    // 1. Check Authentication using custom session
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false, error: "Not authenticated" };
    }
    const userId = session.userId;

    try {
        // 2. Check for existing record for today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const { data: existingRecord, error: fetchError } = await supabaseAdmin
            .from('attendance')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error("Fetch error:", fetchError);
            return { success: false, error: "Failed to fetch attendance" };
        }

        if (existingRecord) {
            // 3. If checked in but not checked out -> Check Out
            if (!existingRecord.check_out_time) {
                const { error: updateError } = await supabaseAdmin
                    .from('attendance')
                    .update({ check_out_time: new Date().toISOString() })
                    .eq('id', existingRecord.id);

                if (updateError) throw updateError;

                // Get user name for better UX from MEMBERS table
                const { data: profile } = await supabaseAdmin.from('members').select('name').eq('id', userId).single();

                return {
                    success: true,
                    status: 'CHECK_OUT',
                    name: profile?.name,
                    time: new Date().toLocaleTimeString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true
                    })
                };
            } else {
                // Already checked out
                const { data: profile } = await supabaseAdmin.from('members').select('name').eq('id', userId).single();
                return { success: true, status: 'ALREADY_COMPLETED', name: profile?.name };
            }
        } else {
            // 4. No record -> Check In
            const { error: insertError } = await supabaseAdmin
                .from('attendance')
                .insert({
                    user_id: userId,
                    check_in_time: new Date().toISOString(),
                    date: today
                });

            if (insertError) throw insertError;

            const { data: profile } = await supabaseAdmin.from('members').select('name').eq('id', userId).single();
            return {
                success: true,
                status: 'CHECK_IN',
                name: profile?.name,
                time: new Date().toLocaleTimeString('en-US', {
                    timeZone: 'Asia/Kolkata',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                })
            };
        }

    } catch (error: any) {
        console.error("Attendance error:", error);
        return { success: false, error: error.message || "Failed to mark attendance" };
    }
}

export async function getTodaysLog() {
    if (!supabaseAdmin) return [];

    // Admin check is handled by RLS on the table usually, or we can check role here.
    // Assuming RLS "Admins can view all" is set.

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

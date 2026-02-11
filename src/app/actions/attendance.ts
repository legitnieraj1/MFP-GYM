"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function markAttendance() {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) { }
            }
        }
    );

    // 1. Check Authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        // 2. Check for existing record for today
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const { data: existingRecord, error: fetchError } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error("Fetch error:", fetchError);
            return { success: false, error: "Failed to fetch attendance" };
        }

        if (existingRecord) {
            // 3. If checked in but not checked out -> Check Out
            if (!existingRecord.check_out_time) {
                const { error: updateError } = await supabase
                    .from('attendance')
                    .update({ check_out_time: new Date().toISOString() })
                    .eq('id', existingRecord.id);

                if (updateError) throw updateError;

                // Get user name for better UX
                const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single();

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
                const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single();
                return { success: true, status: 'ALREADY_COMPLETED', name: profile?.name };
            }
        } else {
            // 4. No record -> Check In
            const { error: insertError } = await supabase
                .from('attendance')
                .insert({
                    user_id: user.id,
                    check_in_time: new Date().toISOString(),
                    date: today
                });

            if (insertError) throw insertError;

            const { data: profile } = await supabase.from('users').select('name').eq('id', user.id).single();
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
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll(cookiesToSet) { }
            }
        }
    );

    // Admin check is handled by RLS on the table usually, or we can check role here.
    // Assuming RLS "Admins can view all" is set.

    const today = new Date().toISOString().split('T')[0];

    const { data: logs, error } = await supabase
        .from('attendance')
        .select(`
            *,
            users (
                name,
                photo
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

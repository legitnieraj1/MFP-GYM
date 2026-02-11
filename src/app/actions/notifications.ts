"use server";

import { supabaseAdmin } from "@/lib/supabase";
import webpush from "web-push";

webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@mfpgym.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
);

export async function saveSubscription(subscription: string) {
    if (!supabaseAdmin) return { success: false, error: "Server config error" };

    try {
        const { data: { user } } = await supabaseAdmin.auth.getUser();
        // Check auth directly or assume triggered by authenticated user via middleware
        // Since this saves to DB based on UUID, we really need the UserId

        // Let's rely on the client calling this being authenticated. 
        // We need to fetch the current user ID securely.
        // But server actions in Next.js usually have access to cookies.

        // Actually, supabaseAdmin.auth.getUser() might not work if we don't pass the cookie.
        // We should use createClient() from @supabase/ssr for auth check in server actions.

        // FALLBACK: For MVP, we can assume this action is secure enough or pass userId? No, risky.
        // Better: Use `supabase` (normal client) to get user, then `supabaseAdmin` to write if RLS allows or assumes admin.
        // Actually `users` table has RLS "Users can update their own profile". So we can use normal supabase client.

        // Wait, I need the server action context to get the user.
        const { createServerClient } = await import("@supabase/ssr");
        const { cookies } = await import("next/headers");

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

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: "Not authenticated" };

        const { error } = await supabaseAdmin
            .from("users")
            .update({ subscription: JSON.parse(subscription) }) // Save as JSON
            .eq("id", user.id);

        if (error) throw error;
        return { success: true };

    } catch (error: any) {
        console.error("Save subscription error:", error);
        return { success: false, error: error.message };
    }
}

export async function sendFeeReminder(userId: string) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        // 1. Fetch user subscription
        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("subscription, name")
            .eq("id", userId)
            .single();

        if (error || !user || !user.subscription) {
            return { success: false, error: "User has not enabled notifications" };
        }

        // 2. Send Notification
        const payload = JSON.stringify({
            title: "Fee Reminder - MFP Gym",
            body: `Hi ${user.name}, your gym membership is ending soon. Please renew to continue your training!`
        });

        await webpush.sendNotification(user.subscription, payload);
        return { success: true };

    } catch (error: any) {
        console.error("Send notification error:", error);
        return { success: false, error: "Failed to send notification" };
    }
}

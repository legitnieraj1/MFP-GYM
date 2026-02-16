import { supabaseAdmin } from "@/lib/supabase";

export async function checkRateLimit(phone: string): Promise<boolean> {
    if (!supabaseAdmin) return false;

    // Check if an OTP was sent in the last 5 seconds (Reduced for testing)
    const thirtySecondsAgo = new Date(Date.now() - 5 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
        .from("otp_codes")
        .select("created_at")
        .eq("phone", phone)
        .gte("created_at", thirtySecondsAgo)
        .limit(1);

    if (error) {
        console.error("Rate limit check error:", error);
        return false; // Fail open or closed? Closed is safer to prevent abuse.
    }

    return data && data.length > 0;
}

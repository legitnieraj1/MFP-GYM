import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyOTP } from "@/lib/otp";
import { createSession, encrypt } from "@/lib/session";

export async function POST(req: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { phone, otp } = body;

        if (!phone || !otp) {
            return NextResponse.json({ error: "invalid_input" }, { status: 400 });
        }

        // 1. Find Record
        const { data: record, error: dbError } = await supabaseAdmin
            .from("otp_codes")
            .select("*")
            .eq("phone", phone)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (dbError || !record) {
            return NextResponse.json({ error: "otp_invalid" }, { status: 400 });
        }

        // 2. Check Expiry
        if (new Date(record.expires_at) < new Date()) {
            return NextResponse.json({ error: "otp_expired" }, { status: 400 });
        }

        // 3. Check Attempts
        if (record.attempts >= 3) {
            return NextResponse.json({ error: "otp_blocked" }, { status: 403 });
        }

        // 4. Verify Hash
        const isValid = await verifyOTP(otp, record.otp_hash);

        if (!isValid) {
            // Increment attempts
            await supabaseAdmin
                .from("otp_codes")
                .update({ attempts: record.attempts + 1 })
                .eq("id", record.id);

            return NextResponse.json({ error: "otp_invalid" }, { status: 400 });
        }

        // 5. Success: Delete OTP Record
        await supabaseAdmin
            .from("otp_codes")
            .delete()
            .eq("id", record.id);

        // 6. Find or Create User
        // Check public.users. If user exists, use that ID.
        const rawPhone = phone.replace(/^\+91/, "");
        const { data: users, error: userError } = await supabaseAdmin
            .from("users")
            .select("id, role")
            .or(`phone.eq.${phone},phone.eq.${rawPhone}`)
            .limit(1);

        if (userError || !users || users.length === 0) {
            return NextResponse.json({ error: "user_not_found" }, { status: 404 });
        }

        const user = users[0];

        // 7. Create Session
        const maxAgeInSeconds = 100 * 365 * 24 * 60 * 60; // 100 years
        const expiresAt = new Date(Date.now() + maxAgeInSeconds * 1000);
        const sessionPayload = { userId: user.id, role: user.role, expiresAt };

        // We need to import encrypt from session lib
        const { encrypt } = require("@/lib/session");
        const sessionToken = await encrypt(sessionPayload);

        const response = NextResponse.json({ success: true });

        response.cookies.set("session", sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            expires: expiresAt,
            maxAge: maxAgeInSeconds,
            sameSite: "lax",
            path: "/",
        });

        return response;

    } catch (error) {
        console.error("Verify OTP Error:", error);
        return NextResponse.json({ error: "server_error" }, { status: 500 });
    }
}

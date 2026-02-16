import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { generateOTP, hashOTP } from "@/lib/otp";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { checkRateLimit } from "@/lib/rateLimiter";

export async function POST(req: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { phone } = body;

        // 1. Validate Phone (Simple E.164 check)
        if (!phone || !/^\+[1-9]\d{1,14}$/.test(phone)) {
            return NextResponse.json({ error: "invalid_number" }, { status: 400 });
        }

        // 2. Rate Limit
        const isRateLimited = await checkRateLimit(phone);
        if (isRateLimited) {
            return NextResponse.json({ error: "rate_limited" }, { status: 429 });
        }

        // 2.5 Check if User Exists (Flexible Match)
        // Check for +91999... OR 999...
        const rawPhone = phone.replace(/^\+91/, "");
        const { data: users, error: userError } = await supabaseAdmin
            .from("users")
            .select("id")
            .or(`phone.eq.${phone},phone.eq.${rawPhone}`)
            .limit(1);

        if (userError || !users || users.length === 0) {
            return NextResponse.json({ error: "user_not_found" }, { status: 404 });
        }

        // 3. Generate OTP
        const otp = generateOTP(6); // 6 digits
        const otpHash = await hashOTP(otp);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        // 4. Store in DB
        const { error: dbError } = await supabaseAdmin
            .from("otp_codes")
            .insert({
                phone,
                otp_hash: otpHash,
                expires_at: expiresAt.toISOString()
            });

        if (dbError) {
            console.error("DB Insert Error:", dbError);
            return NextResponse.json({ error: "server_error" }, { status: 500 });
        }

        // 5. Send WhatsApp
        const message = `Your MFP Gym login code is ${otp}. Valid for 5 minutes.`;
        const sent = await sendWhatsAppMessage(phone, message);

        if (!sent) {
            return NextResponse.json({ error: "whatsapp_error" }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Send OTP Error:", error);
        return NextResponse.json({ error: error.message || "server_error" }, { status: 500 });
    }
}

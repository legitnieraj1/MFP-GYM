import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    try {
        const { orderId, paymentId, signature, plan } = await req.json();

        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== signature) {
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }

        // define duration based on plan
        const durationMonths = plan === 'BASIC' ? 3 : plan === 'PRO' ? 6 : 12;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Update Memberships in Supabase
        // Upsert by checking existing status or just insert new?
        // Let's assume one active membership.
        // We can use upsert if we have a unique constraint on (user_id) but schema didn't enforce it rigidly.
        // Better to use `users` table constraint or just update if exists.

        // Let's check existing membership
        const { data: existing } = await supabaseAdmin
            .from("memberships")
            .select("id")
            .eq("user_id", user.id)
            .single();

        if (existing) {
            await supabaseAdmin
                .from("memberships")
                .update({
                    plan,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: "ACTIVE",
                    amount: plan === 'BASIC' ? 3000 : plan === 'PRO' ? 4500 : 6500
                })
                .eq("id", existing.id);
        } else {
            await supabaseAdmin
                .from("memberships")
                .insert({
                    user_id: user.id,
                    plan,
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    status: "ACTIVE",
                    amount: plan === 'BASIC' ? 3000 : plan === 'PRO' ? 4500 : 6500
                });
        }

        // Record payment
        await supabaseAdmin
            .from("payments")
            .insert({
                user_id: user.id,
                amount: plan === 'BASIC' ? 3000 : plan === 'PRO' ? 4500 : 6500,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId || "manual", // Fallback
                status: "SUCCESS"
            });

        return NextResponse.json({ message: "Payment verified and membership activated" });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ message: "Verification failed" }, { status: 500 });
    }
}

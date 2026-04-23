import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import crypto from "crypto";
import { getSession } from "@/lib/session";

// Total access months (paid + free bonus as shown on the price board)
const PLAN_DURATIONS: Record<string, number> = {
    "1 MONTH":  1,   // 1 month, no bonus
    "3 MONTHS": 6,   // 3 paid + 3 free
    "6 MONTHS": 12,  // 6 paid + 6 free
    "1 YEAR":   24,  // 12 paid + 12 free
    "2 YEARS":  48,  // 24 paid + 24 free
};

// Amounts charged via Razorpay (original price + 2% gateway fee)
const PLAN_PRICES: Record<string, number> = {
    "1 MONTH":  1530,
    "3 MONTHS": 4080,
    "6 MONTHS": 5610,
    "1 YEAR":   8160,
    "2 YEARS":  12750,
};

export async function POST(req: Request) {
    const session = await getSession();

    if (!session || !session.userId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.userId;

    if (!supabaseAdmin) {
        return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    try {
        const { orderId, paymentId, signature, plan } = await req.json();

        // Validate plan
        if (!PLAN_DURATIONS[plan]) {
            return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
        }

        // Verify Razorpay signature
        const body = orderId + "|" + paymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature !== signature) {
            return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
        }

        const durationMonths = PLAN_DURATIONS[plan];
        const amount = PLAN_PRICES[plan];
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        // Update membership dates + plan on the members table
        const { error: updateError } = await supabaseAdmin
            .from("members")
            .update({
                membership_start: startDate.toISOString().split("T")[0],
                membership_end: endDate.toISOString().split("T")[0],
                membership_plan: plan,
            })
            .eq("id", userId);

        if (updateError) {
            console.error("Membership update error:", updateError);
            return NextResponse.json({ message: "Failed to activate membership" }, { status: 500 });
        }

        // Record payment in member_payments
        const { error: paymentError } = await supabaseAdmin
            .from("member_payments")
            .insert({
                member_id: userId,
                plan,
                amount,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId || "manual",
                status: "SUCCESS",
            });

        if (paymentError) {
            console.error("Payment record error:", paymentError);
            // Non-fatal — membership is already activated
        }

        return NextResponse.json({ message: "Payment verified and membership activated" });

    } catch (error) {
        console.error("Payment Verification Error:", error);
        return NextResponse.json({ message: "Verification failed" }, { status: 500 });
    }
}

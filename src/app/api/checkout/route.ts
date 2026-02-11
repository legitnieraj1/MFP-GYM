import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Razorpay from "razorpay";

// We need to parse cookies to get the session token if using Supabase Auth
// But for API routes, we can just assume the client sends the token in Authorization header 
// OR we can use the cookie helper. Admin dashboard used cookies.
// Let's use the standard "get user from auth header or cookie" pattern via supabase-js for now, 
// or since we are server-side, verifying the user is tricky without the token.
// The dashboard page verifies user and then calls this? 
// Actually, API routes in Next 13+ app dir inherit cookies.
// Let's use `createRouteHandlerClient` pattern if we want to be safe, but we don't have that helper set up.
// simpler: Pass userId in body? No, insecure.
// We accept that we need to verify auth.

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLAN_PRICES: Record<string, number> = {
    BASIC: 3000,
    PRO: 4500,
    ELITE: 6500,
};

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

    try {
        const { plan } = await req.json();

        if (!PLAN_PRICES[plan]) {
            return NextResponse.json({ message: "Invalid plan" }, { status: 400 });
        }

        const amount = PLAN_PRICES[plan] * 100; // Amount in paise

        const order = await razorpay.orders.create({
            amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            payment_capture: true,
        });

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({ message: "Failed to create order" }, { status: 500 });
    }
}

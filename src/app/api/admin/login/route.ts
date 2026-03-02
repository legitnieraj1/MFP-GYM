import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSession } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        // Create a temporary Supabase client to verify credentials
        // We don't use the admin client here because signInWithPassword requires non-admin context usually, 
        // or effectively acts as the user.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        // Check Role in Database (using Service Role for safety)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: userData, error: userError } = await supabaseAdmin
            .from("users")
            .select("role")
            .eq("id", data.user.id)
            .single();

        if (userError || (userData?.role !== "ADMIN" && userData?.role !== "DALUXEADMIN")) {
            return NextResponse.json({ error: "Access denied: Not an administrator" }, { status: 403 });
        }

        // Create Custom Session (unifies with User Auth)
        const maxAgeInSeconds = 100 * 365 * 24 * 60 * 60; // 100 years
        const expiresAt = new Date(Date.now() + maxAgeInSeconds * 1000);
        const sessionPayload = { userId: data.user.id, role: userData.role, expiresAt };

        // Use standard cookie setting
        // We need to encryption helper
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

    } catch (error: any) {
        console.error("Admin Login Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

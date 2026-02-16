import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPin, formatMobile, loginUser } from "@/lib/auth";
import { supabaseAdmin, supabase } from "@/lib/supabase";

const loginSchema = z.object({
    mobile: z.string().min(1, "Mobile is required"),
    pin: z.string().min(1, "PIN is required"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { mobile, pin } = loginSchema.parse(body);

        const formattedMobile = formatMobile(mobile);

        // Fetch user - try multiple formats since DB may have +91 prefix
        const db = supabaseAdmin || supabase;

        let user = null;

        // Try exact match first (10 digits)
        const result1 = await db
            .from("members")
            .select("id, name, mobile, pin_hash, legacy_member")
            .eq("mobile", formattedMobile)
            .maybeSingle();

        if (result1.data) {
            user = result1.data;
        } else {
            // Fallback: search for mobile ending with these 10 digits (handles any prefix)
            const result2 = await db
                .from("members")
                .select("id, name, mobile, pin_hash, legacy_member")
                .like("mobile", `%${formattedMobile}`)
                .maybeSingle();

            user = result2.data;
        }

        console.log("Login attempt:", { input: mobile, formatted: formattedMobile, found: !!user, dbMobile: user?.mobile });

        if (!user) {
            return NextResponse.json(
                { error: "Invalid mobile number or PIN" },
                { status: 401 }
            );
        }

        // Verify PIN
        const isValid = await verifyPin(pin, user.pin_hash);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid mobile number or PIN" },
                { status: 401 }
            );
        }

        // Create session
        // Only admins via bulk upload are marked legacy, but currently role is just MEMBER or ADMIN
        // If we need distinct roles, we should fetch from a roles table or column. 
        // For now, let's assume if it came from the bulk upload or signup, they are member access.
        // If there's a separate admin table, that's different.
        // The user request mentions "Admin controls everything" and "Admin UIs".
        // The current session structure has 'role'. I'll default to 'MEMBER' for now.
        // If the user's mobile is recognized as an admin (maybe hardcoded or in DB), we'd set role='ADMIN'.
        // For this task, I'll stick to 'MEMBER' unless I see admin logic.

        await loginUser(user.id, "MEMBER");

        return NextResponse.json({ success: true, user: { id: user.id, name: user.name } });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

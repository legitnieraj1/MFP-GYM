import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPin, formatMobile, loginUser } from "@/lib/auth";
import { supabaseAdmin, supabase } from "@/lib/supabase";

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    age: z.coerce.number().min(5, "Age must be at least 5").max(100, "Age must be under 100"),
    mobile: z.string().length(10, "Mobile must be 10 digits").regex(/^\d+$/, "Mobile must contain request only numbers"),
    pin: z.string().length(4, "PIN must be 4 digits").regex(/^\d+$/, "PIN must contain only numbers"),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, age, mobile, pin } = signupSchema.parse(body);

        const formattedMobile = formatMobile(mobile);
        const hashedPin = await hashPin(pin);

        // Check if user already exists
        // Use admin client if available to bypass RLS, otherwise fallback to anon client
        const db = supabaseAdmin || supabase;

        const { data: existingUser, error: checkError } = await db
            .from("members")
            .select("id")
            .eq("mobile", formattedMobile)
            .single();

        if (existingUser) {
            return NextResponse.json(
                { error: "Mobile number already registered" },
                { status: 400 }
            );
        }

        // Insert new user
        const { data: newUser, error: insertError } = await db
            .from("members")
            .insert({
                name,
                age,
                mobile: formattedMobile,
                pin_hash: hashedPin,
            })
            .select("id, name, legacy_member")
            .single();

        if (insertError) {
            console.error("Signup error:", insertError);
            return NextResponse.json(
                { error: "Failed to create account" },
                { status: 500 }
            );
        }

        // Create session
        await loginUser(newUser.id, "MEMBER");

        return NextResponse.json({ success: true, user: newUser });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }
        console.error("Signup error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

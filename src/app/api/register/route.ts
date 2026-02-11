import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    phone: z.string().min(10),
    age: z.coerce.number().min(10),
    weight: z.coerce.number().min(20),
    height: z.coerce.number().min(50),
    address: z.string().optional(),
    bodyGoal: z.string().optional(),
});

export async function POST(req: Request) {
    if (!supabaseAdmin) {
        return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { name, email, password, phone, age, weight, height, address, bodyGoal } = registerSchema.parse(body);

        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) {
            return NextResponse.json({ message: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ message: "Failed to create user" }, { status: 500 });
        }

        const userId = authData.user.id;

        // 2. Insert into public.users
        const { error: profileError } = await supabaseAdmin
            .from("users")
            .insert({
                id: userId,
                email,
                name,
                phone,
                age,
                weight,
                height,
                address,
                body_goal: bodyGoal, // Mapped to snake_case column
                role: "MEMBER"
            });

        if (profileError) {
            // Rollback auth user
            await supabaseAdmin.auth.admin.deleteUser(userId);
            console.error("Profile creation failed:", profileError);
            return NextResponse.json({ message: "Failed to create user profile" }, { status: 500 });
        }

        return NextResponse.json({ message: "User created successfully", userId }, { status: 201 });

    } catch (error: any) {
        console.error("Registration Error:", error);
        return NextResponse.json({ message: error.errors ? error.errors[0].message : "Something went wrong" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
    const session = await getSession();

    if (!session?.userId) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ user: null }, { status: 500 });
    }

    if (session.role === "ADMIN" || session.role === "DALUXEADMIN") {
        const { data: adminUser } = await supabaseAdmin
            .from("users")
            .select("id, role")
            .eq("id", session.userId)
            .single();

        if (adminUser) {
            return NextResponse.json({ 
                user: { id: adminUser.id, role: adminUser.role, name: "Admin" } 
            });
        }
    }

    const { data: member } = await supabaseAdmin
        .from("members")
        .select("id, name, mobile, membership_type, membership_expiry")
        .eq("id", session.userId)
        .single();

    if (!member) {
        return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: { ...member, role: session.role } });
}


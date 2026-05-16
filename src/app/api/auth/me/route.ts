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

    const { data: member } = await supabaseAdmin
        .from("members")
        .select("id, name, mobile, membership_start, membership_end")
        .eq("id", session.userId)
        .single();

    if (!member) {
        return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user: { ...member, role: session.role } });
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp";
import { normalizePhone } from "@/utils/whatsapp";

export const maxDuration = 60;

// Approved WhatsApp template names/language — must match what's live in
// Meta Business Manager. Configurable so the templates can be renamed or
// re-submitted without a code change.
const PRE_EXPIRY_TEMPLATE = process.env.WHATSAPP_TEMPLATE_PRE_EXPIRY || "membership_pre_expiry_reminder";
const EXPIRY_TEMPLATE = process.env.WHATSAPP_TEMPLATE_EXPIRY || "membership_expiry_reminder";
const TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

// Renders a Date as a YYYY-MM-DD string in the gym's local timezone, so
// "today"/"in 3 days" match the plain `date` values Postgres returns
// regardless of what timezone the cron runner's clock is in.
function istDateString(d: Date): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
}

type ReminderMember = {
    id: string;
    name: string;
    mobile: string;
    membership_end: string;
    auto_pre_expiry_notified_for: string | null;
    auto_expiry_notified_for: string | null;
};

export async function GET(req: Request) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ error: "server_config_error" }, { status: 500 });
    }

    const today = istDateString(new Date());
    const in3Days = istDateString(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000));

    const { data: members, error } = await supabaseAdmin
        .from("members")
        .select("id, name, mobile, membership_end, auto_pre_expiry_notified_for, auto_expiry_notified_for")
        .in("membership_end", [today, in3Days])
        .not("mobile", "is", null);

    if (error) {
        console.error("Cron: failed to fetch members due for reminder", error);
        return NextResponse.json({ error: "query_failed" }, { status: 500 });
    }

    const results = { sent: 0, failed: 0, skipped: 0 };

    for (const member of (members as ReminderMember[]) ?? []) {
        const isExpiryDay = member.membership_end === today;
        const isPreExpiry = member.membership_end === in3Days;

        if (isExpiryDay && member.auto_expiry_notified_for !== member.membership_end) {
            await sendAndTrack(member, EXPIRY_TEMPLATE, "auto_expiry_notified_for", results);
        } else if (isPreExpiry && member.auto_pre_expiry_notified_for !== member.membership_end) {
            await sendAndTrack(member, PRE_EXPIRY_TEMPLATE, "auto_pre_expiry_notified_for", results);
        } else {
            results.skipped += 1;
        }
    }

    return NextResponse.json({ success: true, today, in3Days, checked: members?.length ?? 0, ...results });
}

async function sendAndTrack(
    member: ReminderMember,
    templateName: string,
    trackingColumn: "auto_expiry_notified_for" | "auto_pre_expiry_notified_for",
    results: { sent: number; failed: number; skipped: number }
) {
    const phone = normalizePhone(member.mobile);
    const result = await sendWhatsAppTemplateMessage(phone, templateName, TEMPLATE_LANG, [member.name]);

    if (!result.ok) {
        console.error(`Cron: reminder failed for member ${member.id}`, result.error);
        results.failed += 1;
        return;
    }

    const { error: updateError } = await supabaseAdmin!
        .from("members")
        .update({ [trackingColumn]: member.membership_end, last_reminded_at: new Date().toISOString() })
        .eq("id", member.id);

    if (updateError) {
        console.error(`Cron: sent but failed to record reminder for member ${member.id}`, updateError);
    }

    results.sent += 1;
}

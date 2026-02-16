import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPin, formatMobile } from "@/lib/auth";
import { supabaseAdmin, supabase } from "@/lib/supabase";

// Accept any type and coerce to string — Excel sends numbers for dates, mobiles, etc.
const bulkMemberSchema = z.object({
    enroll_no: z.any().optional(),
    name: z.any(),
    mobile: z.any(),
    start_date: z.any().optional(),
    end_date: z.any().optional(),
});

const bulkUploadSchema = z.array(bulkMemberSchema);

export async function POST(req: Request) {
    try {
        const body = await req.json();

        console.log("Bulk upload: received", Array.isArray(body) ? body.length : 0, "rows");
        if (Array.isArray(body) && body.length > 0) {
            console.log("Bulk upload: first row sample:", JSON.stringify(body[0]));
        }

        const members = bulkUploadSchema.parse(body);

        const db = supabaseAdmin || supabase;
        const results = {
            success: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const member of members) {
            try {
                const name = String(member.name || "").trim();
                const mobile = formatMobile(String(member.mobile || ""));
                const enrollNo = member.enroll_no ? String(member.enroll_no).trim() : null;

                if (!name || mobile.length !== 10) {
                    results.failed++;
                    results.errors.push(`Invalid data for ${name || "unknown"}: mobile=${mobile}`);
                    continue;
                }

                // Default PIN: Enrollment number (fallback to last 4 digits of mobile)
                const pin = enrollNo || mobile.slice(-4);
                const pinHash = await hashPin(pin);

                // Handle Excel serial dates (number) or date strings
                const parseDate = (val: any) => {
                    if (!val) return null;
                    if (typeof val === "number") {
                        // Excel serial date
                        return new Date(Math.round((val - 25569) * 86400 * 1000));
                    }
                    const d = new Date(String(val));
                    return isNaN(d.getTime()) ? null : d;
                };

                const { error } = await db.from("members").insert({
                    enroll_no: enrollNo,
                    name: name,
                    mobile: mobile,
                    pin_hash: pinHash,
                    membership_start: parseDate(member.start_date),
                    membership_end: parseDate(member.end_date),
                    legacy_member: true,
                });

                if (error) {
                    // Check for unique constraint violation
                    if (error.code === '23505') { // unique_violation
                        results.failed++;
                        results.errors.push(`Duplicate mobile for ${member.name}: ${mobile}`);
                    } else {
                        throw error;
                    }
                } else {
                    results.success++;
                }
            } catch (err: any) {
                results.failed++;
                results.errors.push(`Error adding ${member.name}: ${err.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${members.length} records.`,
            details: results
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
        }
        console.error("Bulk upload error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

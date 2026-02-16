"use server";

import { supabaseAdmin } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";

type BulkUploadResult = {
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
};

export async function processBulkUpload(formData: FormData): Promise<BulkUploadResult> {
    if (!supabaseAdmin) {
        return { success: false, processed: 0, failed: 0, errors: ["Server configuration error"] };
    }

    const file = formData.get("file") as File;
    if (!file) {
        return { success: false, processed: 0, failed: 0, errors: ["No file uploaded"] };
    }

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Use raw parsing first
        const rows: any[] = XLSX.utils.sheet_to_json(sheet);

        let processed = 0;
        let failed = 0;
        const errors: string[] = [];

        // 1. PRE-FETCH ALL AUTH USERS to handle "Already Registered" cases efficiently
        // This is crucial to fix the "User already registered but not in DB" error.
        const phoneToIdMap = new Map<string, string>();

        let hasMore = true;
        let page = 1;
        const perPage = 1000; // Maximize page size

        try {
            while (hasMore) {
                const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers({
                    page: page,
                    perPage: perPage
                });

                if (listError) throw listError;

                if (!users || users.length === 0) {
                    hasMore = false;
                } else {
                    users.forEach(u => {
                        if (u.phone) {
                            // Map exact phone
                            phoneToIdMap.set(u.phone, u.id);
                            // Map last 10 digits for loose matching (robust against +91 vs 91 vs none)
                            const clean = u.phone.replace(/\D/g, "").slice(-10);
                            if (clean.length === 10) {
                                phoneToIdMap.set(clean, u.id);
                            }
                        }
                    });
                    if (users.length < perPage) hasMore = false;
                    page++;
                }
            }
        } catch (fetchErr) {
            console.error("Error pre-fetching users:", fetchErr);
            // We continue, but fallback to individual checks will fail for existing users. 
            // Better to abort or warn? We continue and try our best with creates.
        }

        for (const [index, row] of rows.entries()) {
            const rowIndex = index + 2; // +2 considering 1-based index and header row

            // Normalize keys: lowercase and remove spaces
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
                normalizedRow[key.toLowerCase().replace(/[^a-z0-9]/g, "")] = row[key];
            });

            // Target Columns: enroll no | Name | start date | end date | mobile number
            const name = normalizedRow["name"];
            const phoneRaw = normalizedRow["mobilenumber"] || normalizedRow["mobile"] || normalizedRow["phone"];
            const enrollNumber = normalizedRow["enrollno"] || normalizedRow["enrollmentnumber"] || normalizedRow["enrollmentno"] || normalizedRow["id"];

            const startDateRaw = normalizedRow["startdate"];
            const endDateRaw = normalizedRow["enddate"];

            // Validation
            if (!name || !phoneRaw) {
                errors.push(`Row ${rowIndex}: Missing Name or Mobile Number`);
                failed++;
                continue;
            }

            // Phone Formatting (+91)
            let phone = String(phoneRaw).replace(/\D/g, "");
            if (phone.length === 10) phone = `+91${phone}`;
            else if (phone.length < 10) {
                errors.push(`Row ${rowIndex}: Invalid Phone Number (${phoneRaw})`);
                failed++;
                continue;
            }

            try {
                const cleanInputPhone = phone.replace(/\D/g, "").slice(-10);
                let userId = phoneToIdMap.get(phone) || phoneToIdMap.get(cleanInputPhone) || "";

                if (!userId) {
                    // Create new user
                    const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        phone: phone,
                        phone_confirm: true,
                        user_metadata: { name }
                    });

                    if (createError) {
                        // Double check if it was caught in our map mismatch or race condition
                        if (createError.message?.toLowerCase().includes("already registered")) {
                            errors.push(`Row ${rowIndex}: User already exists but was not found in pre-fetch list. Skipping.`);
                            failed++;
                            continue;
                        }
                        throw createError;
                    } else if (createdUser.user) {
                        userId = createdUser.user.id;
                        // Add to map for subsequent rows if duplicates exist in sheet
                        phoneToIdMap.set(phone, userId);
                    }
                }

                if (!userId) {
                    errors.push(`Row ${rowIndex}: Could not resolve User ID.`);
                    failed++;
                    continue;
                }

                // 2. Upsert Public Profile
                // We map 'enroll no' to 'enrollment_number'
                const { error: profileError } = await supabaseAdmin
                    .from("users")
                    .upsert({
                        id: userId,
                        name: name,
                        phone: phone,
                        enrollment_number: enrollNumber ? String(enrollNumber) : null,
                        role: "MEMBER"
                    }, { onConflict: "id" });

                if (profileError) throw profileError;

                // 3. Handle Membership
                // Date Parsing Helper
                const parseDate = (val: any) => {
                    if (!val) return null;
                    // Excel Serial Date
                    if (typeof val === 'number') {
                        return new Date(Math.round((val - 25569) * 86400 * 1000));
                    }
                    // String Formats
                    if (typeof val === 'string') {
                        val = val.trim();
                        // DD-MM-YY or DD-MM-YYYY or DD/MM/YY
                        // Regex for DD[-/]MM[-/]YY(YY)
                        const parts = val.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
                        if (parts) {
                            const day = parseInt(parts[1], 10);
                            const month = parseInt(parts[2], 10) - 1;
                            let year = parseInt(parts[3], 10);
                            // Handle 2-digit year (e.g., 25 -> 2025)
                            if (year < 100) year += 2000;
                            return new Date(year, month, day);
                        }
                        // Try standard constructor
                        const d = new Date(val);
                        if (!isNaN(d.getTime())) return d;
                    }
                    return null;
                };

                const start = parseDate(startDateRaw);
                const end = parseDate(endDateRaw);

                if (start && end) {
                    const isActive = end > new Date();

                    // Simple logic for plan detection based on duration
                    // 1 month ~ 30 days
                    const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                    let plan = "BASIC";
                    if (days > 300) plan = "ELITE"; // ~1 year
                    else if (days > 150) plan = "PRO"; // ~6 months
                    else if (days > 80) plan = "STANDARD"; // ~3 months

                    // Upsert Membership
                    // We identify by user_id to avoid duplicates for the same user
                    // NOTE: If they have history, this overwrites their "Current" logical membership in this simple model
                    const { error: membershipError } = await supabaseAdmin
                        .from("memberships")
                        .upsert({
                            user_id: userId,
                            plan: plan,
                            start_date: start.toISOString(),
                            end_date: end.toISOString(),
                            status: isActive ? "ACTIVE" : "EXPIRED",
                            amount: 0
                        }, { onConflict: "user_id" });

                    if (membershipError) throw membershipError;
                }

                processed++;

            } catch (err: any) {
                console.error(`Row ${rowIndex} Error:`, err.message);
                errors.push(`Row ${rowIndex}: ${err.message}`);
                failed++;
            }
        }

        revalidatePath("/admin/members");
        return { success: true, processed, failed, errors };

    } catch (error: any) {
        console.error("Bulk Upload Fatal Error:", error);
        return { success: false, processed: 0, failed: 0, errors: [error.message || "Unknown error"] };
    }
}

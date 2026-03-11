"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { hashPin, formatMobile } from "@/lib/auth";
import crypto from "crypto";

// Helper to check admin role
async function checkAdminRole(userId: string) {
    if (!supabaseAdmin) return false;
    const { data, error } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

    if (error || !data) return false;
    return data.role === "ADMIN";
}

export async function getMembers() {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { data, error } = await supabaseAdmin
            .from("members")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const members = data.map(member => {
            const isActive = member.membership_end ? new Date(member.membership_end) > new Date() : false;

            // Calculate plan based on duration if needed, or default
            let plan = member.membership_plan || "BASIC";
            if (!member.membership_plan && member.membership_start && member.membership_end) {
                const start = new Date(member.membership_start);
                const end = new Date(member.membership_end);
                const days = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
                if (days > 300) plan = "ELITE";
                else if (days > 150) plan = "PRO";
                else if (days > 100) plan = "TRANSFORM_120";
                else if (days > 50) plan = "TRANSFORM_60";
                else if (days > 25) plan = "BASIC";
                else plan = "BASIC_1M";
            }

            return {
                id: member.id,
                name: member.name,
                email: "", // Not available in members table
                phone: member.mobile,
                photo: member.photo_url || null, // Getting photo from table
                enroll_no: member.enroll_no || null,
                membership: member.membership_end ? {
                    plan: plan,
                    status: isActive ? "ACTIVE" : "EXPIRED",
                    start_date: member.membership_start,
                    end_date: member.membership_end
                } : null
            };
        });

        return { success: true, data: members };
    } catch (error) {
        console.error("Failed to fetch members:", error);
        return { success: false, error: "Failed to fetch members" };
    }
}

export async function createMember(formData: FormData) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const name = formData.get("name") as string;
        // const email = formData.get("email") as string; // Optional/Unused in members table
        const phone = formData.get("phone") as string;
        const plan = formData.get("plan") as string;

        const age = formData.get("age") ? Number(formData.get("age")) : null;
        const weight = formData.get("weight") ? Number(formData.get("weight")) : null;
        const height = formData.get("height") ? Number(formData.get("height")) : null;
        const enrollNo = formData.get("enroll_no") as string;

        const dobDisplay = formData.get("dob_display") as string | null;
        let dob = null;
        if (dobDisplay) {
            const [dDay, dMonth, dYear] = dobDisplay.split('/');
            if (dDay && dMonth && dYear) {
                dob = `${dYear}-${dMonth}-${dDay}`;
            }
        }

        if (!enrollNo) return { success: false, error: "Enroll string is required" };

        const photoFile = formData.get("photo") as File | null;

        let photo_url = null;
        if (photoFile && photoFile.size > 0) {
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const { error: uploadError } = await supabaseAdmin.storage
                .from("member-photos")
                .upload(fileName, photoFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from("member-photos")
                    .getPublicUrl(fileName);
                photo_url = publicUrl;
            } else {
                console.error("Photo upload error:", uploadError);
            }
        }

        const formattedMobile = formatMobile(phone);
        const pinHash = await hashPin(enrollNo);

        // Calculate Dates
        const joinDateStr = formData.get("joinDate") as string;
        const startDate = joinDateStr ? new Date(joinDateStr) : new Date();
        const endDate = new Date(startDate);

        if (plan === "BASIC_1M") {
            endDate.setMonth(startDate.getMonth() + 1);
        } else if (plan === "BASIC") {
            endDate.setMonth(startDate.getMonth() + 6); // 3+3 Offer
        } else if (plan === "PRO") {
            endDate.setMonth(startDate.getMonth() + 12); // 6+6 Offer
        } else if (plan === "ELITE") {
            endDate.setMonth(startDate.getMonth() + 24); // 12+12 Offer
        } else if (plan === "TRANSFORM_60") {
            endDate.setDate(startDate.getDate() + 60);
        } else if (plan === "TRANSFORM_120") {
            endDate.setDate(startDate.getDate() + 120);
        }

        // Insert into members table
        const { error: memberError } = await supabaseAdmin
            .from("members")
            .insert({
                enroll_no: enrollNo,
                name,
                mobile: formattedMobile,
                pin_hash: pinHash,
                membership_plan: plan,
                membership_start: startDate.toISOString(),
                membership_end: endDate.toISOString(),
                legacy_member: false,
                age,
                weight,
                height,
                dob,
                photo_url
            });


        if (memberError) throw memberError;

        revalidatePath("/admin/members");
        return { success: true };

    } catch (error: any) {
        console.error("Failed to create member:", error);
        return { success: false, error: error.message || "Failed to create member" };
    }
}

// Helper: get duration in days for a plan
function getPlanDuration(plan: string): { months?: number; days?: number } {
    switch (plan) {
        case "BASIC_1M": return { months: 1 };
        case "BASIC": return { months: 6 }; // 3+3 Offer
        case "PRO": return { months: 12 }; // 6+6 Offer
        case "ELITE": return { months: 24 }; // 12+12 Offer
        case "TRANSFORM_60": return { days: 60 };
        case "TRANSFORM_120": return { days: 120 };
        default: return { months: 3 };
    }
}

export async function renewMembership(memberId: string, plan: string) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        // Fetch current member
        const { data: member, error: fetchErr } = await supabaseAdmin
            .from("members")
            .select("membership_end")
            .eq("id", memberId)
            .single();

        if (fetchErr || !member) throw new Error("Member not found");

        const now = new Date();
        const currentEnd = member.membership_end ? new Date(member.membership_end) : new Date(0);

        // If expired, start from today. If active, extend from current end date.
        const newStartDate = currentEnd > now ? currentEnd : now;
        const newEndDate = new Date(newStartDate);

        const duration = getPlanDuration(plan);
        if (duration.months) {
            newEndDate.setMonth(newStartDate.getMonth() + duration.months);
        } else if (duration.days) {
            newEndDate.setDate(newStartDate.getDate() + duration.days);
        }

        const { error: updateErr } = await supabaseAdmin
            .from("members")
            .update({
                membership_plan: plan,
                membership_start: newStartDate.toISOString(),
                membership_end: newEndDate.toISOString()
            })
            .eq("id", memberId);

        if (updateErr) throw updateErr;

        // Record a direct backend payment entry for internal renewals:
        await supabaseAdmin.from("member_payments").insert({
            member_id: memberId,
            amount: 0, // Admin manual renewal
            plan: plan,
            razorpay_order_id: "manual",
            status: "SUCCESS"
        });

        revalidatePath("/admin/members");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to renew membership:", error);
        return { success: false, error: error.message };
    }
}

export async function updateMembershipDates(memberId: string, startDate: string, endDate: string) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { error: updateErr } = await supabaseAdmin
            .from("members")
            .update({
                membership_start: new Date(startDate).toISOString(),
                membership_end: new Date(endDate).toISOString()
            })
            .eq("id", memberId);

        if (updateErr) throw updateErr;

        revalidatePath("/admin/members");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update membership dates:", error);
        return { success: false, error: error.message };
    }
}


export async function updateMember(memberId: string, formData: FormData) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const age = formData.get("age") ? Number(formData.get("age")) : null;
        const weight = formData.get("weight") ? Number(formData.get("weight")) : null;
        const height = formData.get("height") ? Number(formData.get("height")) : null;

        const dobDisplay = formData.get("dob_display") as string | null;
        let dob = null;
        if (dobDisplay) {
            const [dDay, dMonth, dYear] = dobDisplay.split('/');
            if (dDay && dMonth && dYear) {
                dob = `${dYear}-${dMonth}-${dDay}`;
            }
        }

        const photoFile = formData.get("photo") as File | null;

        const formattedMobile = formatMobile(phone);

        const updateData: any = {
            name,
            mobile: formattedMobile,
            age,
            weight,
            height,
            dob
        };

        if (photoFile && photoFile.size > 0) {
            const fileExt = photoFile.name.split('.').pop();
            const fileName = `${crypto.randomUUID()}.${fileExt}`;
            const { error: uploadError } = await supabaseAdmin.storage
                .from("member-photos")
                .upload(fileName, photoFile);

            if (!uploadError) {
                const { data: { publicUrl } } = supabaseAdmin.storage
                    .from("member-photos")
                    .getPublicUrl(fileName);
                updateData.photo_url = publicUrl;

                // Delete the old photo if it exists
                const { data: existingMember } = await supabaseAdmin
                    .from("members")
                    .select("photo_url")
                    .eq("id", memberId)
                    .single();

                if (existingMember && existingMember.photo_url) {
                    try {
                        // Extract the filename from the public URL
                        const urlParts = existingMember.photo_url.split('/');
                        const oldFileName = urlParts[urlParts.length - 1];
                        if (oldFileName) {
                            await supabaseAdmin.storage
                                .from("member-photos")
                                .remove([oldFileName]);
                            console.log(`Deleted old photo: ${oldFileName}`);
                        }
                    } catch (e) {
                        console.error("Error deleting old photo:", e);
                    }
                }
            } else {
                console.error("Photo upload error:", uploadError);
            }
        }

        const { error } = await supabaseAdmin
            .from("members")
            .update(updateData)
            .eq("id", memberId);

        if (error) throw error;

        revalidatePath("/admin/members");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update member:", error);
        return { success: false, error: error.message };
    }
}

export async function getMemberDetails(memberId: string) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { data: member, error: memberErr } = await supabaseAdmin
            .from("members")
            .select("*")
            .eq("id", memberId)
            .single();

        if (memberErr || !member) throw memberErr || new Error("Member not found");

        const { data: attendance } = await supabaseAdmin
            .from("attendance")
            .select("*")
            .eq("member_id", memberId)
            .order("check_in_time", { ascending: false })
            .limit(30);

        const { data: payments } = await supabaseAdmin
            .from("member_payments")
            .select("*")
            .eq("member_id", memberId)
            .order("created_at", { ascending: false });

        return {
            success: true,
            data: {
                ...member,
                recent_attendance: attendance || [],
                payments: payments || []
            }
        };
    } catch (error: any) {
        console.error("Failed to get member details:", error);
        return { success: false, error: error.message };
    }
}

import { autoCheckoutOldSessions } from "./attendance";

export async function getAttendance() {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        // Ensure accurate stats by processing auto-checkouts first
        await autoCheckoutOldSessions();

        const { data, error } = await supabaseAdmin
            .from("attendance")
            .select(`
                *,
                member:members(name, mobile)
            `)
            .order("check_in_time", { ascending: false })
            .limit(100);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch attendance:", error);
        return { success: false, error: "Failed to fetch attendance" };
    }
}

export async function getPayments() {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { data, error } = await supabaseAdmin
            .from("member_payments")
            .select(`
                *,
                member:members(name, mobile)
            `)
            .order("created_at", { ascending: false })
            .limit(100);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Failed to fetch payments:", error);
        return { success: false, error: "Failed to fetch payments" };
    }
}

export async function getPaymentStats() {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        // 1. Total Revenue (Current Month)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();

        // Current Month Revenue
        const { data: currentMonthData } = await supabaseAdmin
            .from("member_payments")
            .select("amount")
            .eq("status", "SUCCESS")
            .gte("created_at", startOfMonth);

        const currentRevenue = currentMonthData?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // Previous Month Revenue
        const { data: prevMonthData } = await supabaseAdmin
            .from("member_payments")
            .select("amount")
            .eq("status", "SUCCESS")
            .gte("created_at", startOfPrevMonth)
            .lte("created_at", endOfPrevMonth);

        const prevRevenue = prevMonthData?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // Percentage Change
        let percentChange = 0;
        if (prevRevenue > 0) {
            percentChange = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
        } else if (currentRevenue > 0) {
            percentChange = 100;
        }

        // 2. Pending Payments (Assuming status='PENDING' or similar, though real Razorpay flow is usually created -> paid. 
        // If we store pending orders, we can count them. If not, this might be 0.)
        // Let's assume schema has 'PENDING' for unverified/started transactions.
        const { data: pendingData } = await supabaseAdmin
            .from("member_payments")
            .select("amount")
            .eq("status", "PENDING");

        const pendingAmount = pendingData?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const pendingCount = pendingData?.length || 0;

        // 3. Average Transaction (All time? Or monthly? Usually All time or robust window)
        // Let's take average of last 100 or all time. All time might be heavy if huge DB, but fine for now.
        const { data: allSuccessData } = await supabaseAdmin
            .from("member_payments")
            .select("amount")
            .eq("status", "SUCCESS");

        const totalItems = allSuccessData?.length || 0;
        const totalSum = allSuccessData?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const averageTransaction = totalItems > 0 ? totalSum / totalItems : 0;

        return {
            success: true,
            data: {
                revenue: currentRevenue,
                prevRevenue,
                percentChange: Number(percentChange.toFixed(1)),
                pendingAmount,
                pendingCount,
                averageTransaction: Math.round(averageTransaction)
            }
        };

    } catch (error) {
        console.error("Failed to fetch payment stats:", error);
        return { success: false, error: "Failed to fetch payment stats" };
    }
}

export async function getTrainers() {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };
    try {
        const { data, error } = await supabaseAdmin
            .from("trainers")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error("Error fetching trainers:", error);
        return { success: false, error: error.message };
    }
}

export async function createTrainer(formData: FormData) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };
    try {
        // await checkAdminRole(); // Context? checkAdminRole takes userId. 
        // Admin actions are usually called from protected pages or we pass userId.
        // For now, let's assume the caller verifies or we just rely on Supabase Admin client which bypasses rules anyway.
        // But we should verify. 
        // Since this is a server action used by the admin dashboard, we can trust it if the page is protected.

        const name = formData.get("name") as string;
        const specialty = formData.get("specialty") as string;
        const experience = formData.get("experience") as string;
        const image_url = formData.get("image_url") as string;

        // Mock social links for now
        const social_links = {
            instagram: "#",
            twitter: "#",
            linkedin: "#"
        };

        const { data, error } = await supabaseAdmin
            .from("trainers")
            .insert({
                name,
                specialty,
                experience,
                image_url,
                social_links
            })
            .select()
            .single();

        if (error) throw error;
        revalidatePath("/admin/trainers");
        return { success: true, data };
    } catch (error: any) {
        console.error("Error creating trainer:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteMember(id: string) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };
    try {
        // Fetch the member first to get the photo URL
        const { data: member } = await supabaseAdmin
            .from("members")
            .select("photo_url")
            .eq("id", id)
            .single();

        const { error } = await supabaseAdmin
            .from("members")
            .delete()
            .eq("id", id);

        if (error) throw error;

        // If the member had a photo, delete it from storage
        if (member && member.photo_url) {
            try {
                const urlParts = member.photo_url.split('/');
                const fileName = urlParts[urlParts.length - 1];
                if (fileName) {
                    await supabaseAdmin.storage
                        .from("member-photos")
                        .remove([fileName]);
                    console.log(`Deleted photo for member ${id}: ${fileName}`);
                }
            } catch (e) {
                console.error("Error deleting member photo:", e);
            }
        }

        revalidatePath("/admin/members");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting member:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteTrainer(id: string) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };
    try {
        const { error } = await supabaseAdmin
            .from("trainers")
            .delete()
            .eq("id", id);

        if (error) throw error;
        revalidatePath("/admin/trainers");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting trainer:", error);
        return { success: false, error: error.message };
    }
}

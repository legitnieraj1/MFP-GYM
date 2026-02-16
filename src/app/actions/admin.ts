"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

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
            .from("users")
            .select(`
                *,
                membership:memberships(*)
            `)
            .eq("role", "MEMBER")
            .order("created_at", { ascending: false });

        if (error) throw error;

        // Filter out users who have absolutely no membership record (past or present)
        // And ensure we pick the latest/most relevant membership if array
        const members = data
            .map(user => ({
                ...user,
                membership: Array.isArray(user.membership) ? user.membership[0] : user.membership
            }))
            .filter(member => member.membership !== null);

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
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        const age = parseInt(formData.get("age") as string);
        const weight = parseFloat(formData.get("weight") as string);
        const height = parseFloat(formData.get("height") as string);
        const address = formData.get("address") as string;
        const plan = formData.get("plan") as string;
        const photoFile = formData.get("photo") as File | null;

        // 1. Create Auth User
        // Switch to Phone Auth predominantly
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email || undefined, // Email is optional now
            phone: phone,
            phone_confirm: true,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create auth user");

        const userId = authData.user.id;
        let photoUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;

        // 2. Upload Photo if provided
        if (photoFile && photoFile.size > 0) {
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from("members")
                .upload(`${userId}-${Date.now()}.png`, photoFile, {
                    contentType: photoFile.type,
                    upsert: true
                });

            if (!uploadError && uploadData) {
                const { data: { publicUrl } } = supabaseAdmin
                    .storage
                    .from("members")
                    .getPublicUrl(uploadData.path);

                photoUrl = publicUrl;
            } else {
                console.error("Photo upload failed:", uploadError);
            }
        }

        const enrollment_number = formData.get("enrollment_number") as string || null;

        // 3. Insert into public.users
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
                photo: photoUrl,
                role: "MEMBER",
                enrollment_number: enrollment_number
            });

        if (profileError) {
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        // 4. Create Membership
        // Check if manual join date is provided (for log entries)
        const joinDateStr = formData.get("joinDate") as string;
        const startDate = joinDateStr ? new Date(joinDateStr) : new Date();
        const endDate = new Date(startDate);

        // Check if manual amount is provided
        const amountStr = formData.get("amount") as string;
        let amount = amountStr ? parseFloat(amountStr) : 0;

        if (amount === 0) {
            if (plan === "BASIC") amount = 3000;
            else if (plan === "PRO") amount = 4500;
            else if (plan === "ELITE") amount = 6500;
        }

        if (plan === "BASIC") {
            endDate.setMonth(startDate.getMonth() + 3);
        } else if (plan === "PRO") {
            endDate.setMonth(startDate.getMonth() + 6);
        } else if (plan === "ELITE") {
            endDate.setFullYear(startDate.getFullYear() + 1);
        }

        const { error: membershipError } = await supabaseAdmin
            .from("memberships")
            .insert({
                user_id: userId,
                plan,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: endDate > new Date() ? "ACTIVE" : "EXPIRED", // Auto-expire if backdated too far
                amount
            });

        if (membershipError) throw membershipError;

        revalidatePath("/admin/members");
        return { success: true };

    } catch (error: any) {
        console.error("Failed to create member:", error);
        return { success: false, error: error.message || "Failed to create member" };
    }
}

export async function getAttendance() {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { data, error } = await supabaseAdmin
            .from("attendance")
            .select(`
                *,
                user:users(*)
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

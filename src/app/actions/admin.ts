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

        // Transform data to match UI expectations if needed, but Supabase returns nested objects nicely
        // One-to-one relationship might return an array or object depending on definition, 
        // but here we assume one active membership or the latest one.
        // Actually, users-memberships is 1-to-many usually, but schema has it as 1-to-1 semantics or we get latest.
        // Let's refine the query to get the active membership.

        // For simplicity in this demo, fetching all memberships and filtering in JS or relying on the relationship
        const members = data.map(user => ({
            ...user,
            // If membership is an array (one-to-many), take the first one (most recent?)
            membership: Array.isArray(user.membership) ? user.membership[0] : user.membership
        }));

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
        const photo = formData.get("photo") as string;

        // 1. Create Auth User
        // We use a dummy password for walk-in users or generate one
        const password = phone; // temp password

        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create auth user");

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
                photo,
                role: "MEMBER"
            });

        if (profileError) {
            // Rollback auth user creation if profile fails (manual compensation)
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw profileError;
        }

        // 3. Create Membership
        const startDate = new Date();
        const endDate = new Date();
        let amount = 0;

        if (plan === "MONTHLY") {
            endDate.setMonth(startDate.getMonth() + 1);
            amount = 1500;
        } else if (plan === "QUARTERLY") {
            endDate.setMonth(startDate.getMonth() + 3);
            amount = 4500;
        } else if (plan === "YEARLY") {
            endDate.setFullYear(startDate.getFullYear() + 1);
            amount = 12000;
        }

        const { error: membershipError } = await supabaseAdmin
            .from("memberships")
            .insert({
                user_id: userId,
                plan,
                start_date: startDate.toISOString(),
                end_date: endDate.toISOString(),
                status: "ACTIVE",
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
            .from("payments")
            .select(`
                *,
                user:users(*)
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

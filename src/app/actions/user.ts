"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function updateMyProfile(formData: FormData) {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const session = await getSession();
        if (!session?.userId) {
            return { success: false, error: "Unauthorized" };
        }

        const age = formData.get("age") ? Number(formData.get("age")) : null;
        const weight = formData.get("weight") ? Number(formData.get("weight")) : null;
        const height = formData.get("height") ? Number(formData.get("height")) : null;
        const dobRaw = formData.get("dob") as string | null;
        const dob = dobRaw ? dobRaw : null;
        const photoFile = formData.get("photo") as File | null;

        const updateData: any = {
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
            } else {
                console.error("Photo upload error:", uploadError);
            }
        }

        const { error } = await supabaseAdmin
            .from("members")
            .update(updateData)
            .eq("id", session.userId);

        if (error) throw error;

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to update profile:", error);
        return { success: false, error: error.message };
    }
}

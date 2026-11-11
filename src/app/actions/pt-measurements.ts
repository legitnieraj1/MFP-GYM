"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PTMeasurement = {
    id: string;
    member_id: string;
    day_number: number;
    weight_kg: number | null;
    bmi: number | null;
    body_fat_pct: number | null;
    measured_at: string;
    created_at: string;
    updated_at: string;
};

export type PTMeasurementResult = {
    success: boolean;
    data?: PTMeasurement[];
    error?: string;
};

// ---------------------------------------------------------------------------
// Fetch all measurements for a member (sorted by day_number ASC)
// ---------------------------------------------------------------------------
export async function getPTMeasurements(memberId: string): Promise<PTMeasurementResult> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { data, error } = await supabaseAdmin
            .from("pt_measurements")
            .select("*")
            .eq("member_id", memberId)
            .order("day_number", { ascending: true });

        if (error) throw error;
        return { success: true, data: data as PTMeasurement[] };
    } catch (err: any) {
        console.error("getPTMeasurements error:", err);
        return { success: false, error: err.message || "Failed to fetch measurements" };
    }
}

// ---------------------------------------------------------------------------
// Add a new measurement row
// ---------------------------------------------------------------------------
export async function addPTMeasurement(
    memberId: string,
    dayNumber: number,
    weightKg: number | null,
    bmi: number | null,
    bodyFatPct: number | null,
    measuredAt: string
): Promise<{ success: boolean; data?: PTMeasurement; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { data, error } = await supabaseAdmin
            .from("pt_measurements")
            .insert({
                member_id: memberId,
                day_number: dayNumber,
                weight_kg: weightKg,
                bmi,
                body_fat_pct: bodyFatPct,
                measured_at: measuredAt,
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: `Day ${dayNumber} already exists for this member. Use a different day number.` };
            }
            throw error;
        }

        revalidatePath("/admin/pt-measurements");
        return { success: true, data: data as PTMeasurement };
    } catch (err: any) {
        console.error("addPTMeasurement error:", err);
        return { success: false, error: err.message || "Failed to add measurement" };
    }
}

// ---------------------------------------------------------------------------
// Update an existing measurement row
// ---------------------------------------------------------------------------
export async function updatePTMeasurement(
    id: string,
    dayNumber: number,
    weightKg: number | null,
    bmi: number | null,
    bodyFatPct: number | null,
    measuredAt: string
): Promise<{ success: boolean; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { error } = await supabaseAdmin
            .from("pt_measurements")
            .update({
                day_number: dayNumber,
                weight_kg: weightKg,
                bmi,
                body_fat_pct: bodyFatPct,
                measured_at: measuredAt,
            })
            .eq("id", id);

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: `Day ${dayNumber} already exists for this member.` };
            }
            throw error;
        }

        revalidatePath("/admin/pt-measurements");
        return { success: true };
    } catch (err: any) {
        console.error("updatePTMeasurement error:", err);
        return { success: false, error: err.message || "Failed to update measurement" };
    }
}

// ---------------------------------------------------------------------------
// Delete a measurement row
// ---------------------------------------------------------------------------
export async function deletePTMeasurement(id: string): Promise<{ success: boolean; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { error } = await supabaseAdmin
            .from("pt_measurements")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/admin/pt-measurements");
        return { success: true };
    } catch (err: any) {
        console.error("deletePTMeasurement error:", err);
        return { success: false, error: err.message || "Failed to delete measurement" };
    }
}

// ---------------------------------------------------------------------------
// Get next suggested day number for a member (max existing + 1, or 1 if none)
// ---------------------------------------------------------------------------
export async function getNextDayNumber(memberId: string): Promise<number> {
    if (!supabaseAdmin) return 1;

    try {
        const { data, error } = await supabaseAdmin
            .from("pt_measurements")
            .select("day_number")
            .eq("member_id", memberId)
            .order("day_number", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) return 1;
        return (data.day_number as number) + 1;
    } catch {
        return 1;
    }
}


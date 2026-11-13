"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ChallengeType = "90_DAYS" | "120_DAYS";

export type ChallengeCandidate = {
    id: string;
    member_id: string;
    challenge_type: ChallengeType;
    start_date: string;
    created_at: string;
    updated_at: string;
    member: {
        id: string;
        name: string;
        enroll_no: string | null;
        photo_url: string | null;
        mobile?: string | null;
        membership_plan?: string | null;
    };
    latest_day?: number | null;
    latest_measurement_date?: string | null;
    total_measurements?: number;
};

export type PTMeasurement = {
    id: string;
    member_id: string;
    challenge_type?: ChallengeType | null;
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
// Candidate Management Actions
// ---------------------------------------------------------------------------

/**
 * Fetch candidates enrolled in a specific challenge (90_DAYS or 120_DAYS).
 * Enriched with member details, latest measurement day & date, and reading count.
 */
export async function getChallengeCandidates(
    challengeType: ChallengeType
): Promise<{ success: boolean; data?: ChallengeCandidate[]; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { data: candidates, error } = await supabaseAdmin
            .from("pt_challenge_candidates")
            .select(`
                id,
                member_id,
                challenge_type,
                start_date,
                created_at,
                updated_at,
                member:members (
                    id,
                    name,
                    enroll_no,
                    photo_url,
                    mobile,
                    membership_plan
                )
            `)
            .eq("challenge_type", challengeType)
            .order("start_date", { ascending: false });

        if (error) throw error;

        if (!candidates || candidates.length === 0) {
            return { success: true, data: [] };
        }

        const memberIds = candidates.map((c: any) => c.member_id);

        // Fetch all measurements for these members to compute latest day, latest date & total readings
        const { data: measurements } = await supabaseAdmin
            .from("pt_measurements")
            .select("member_id, day_number, measured_at")
            .in("member_id", memberIds)
            .order("day_number", { ascending: true });

        const measurementMap = new Map<string, { latestDay: number; latestDate: string; count: number }>();

        (measurements || []).forEach((m: any) => {
            const current = measurementMap.get(m.member_id);
            if (!current) {
                measurementMap.set(m.member_id, {
                    latestDay: m.day_number,
                    latestDate: m.measured_at,
                    count: 1,
                });
            } else {
                current.count += 1;
                if (m.day_number >= current.latestDay) {
                    current.latestDay = m.day_number;
                    current.latestDate = m.measured_at;
                }
            }
        });

        const enrichedCandidates: ChallengeCandidate[] = candidates.map((c: any) => {
            const memberObj = Array.isArray(c.member) ? c.member[0] : c.member;
            const stats = measurementMap.get(c.member_id);

            return {
                id: c.id,
                member_id: c.member_id,
                challenge_type: c.challenge_type,
                start_date: c.start_date,
                created_at: c.created_at,
                updated_at: c.updated_at,
                member: {
                    id: memberObj?.id || c.member_id,
                    name: memberObj?.name || "Unknown Member",
                    enroll_no: memberObj?.enroll_no || null,
                    photo_url: memberObj?.photo_url || null,
                    mobile: memberObj?.mobile || null,
                    membership_plan: memberObj?.membership_plan || null,
                },
                latest_day: stats?.latestDay || null,
                latest_measurement_date: stats?.latestDate || null,
                total_measurements: stats?.count || 0,
            };
        });

        return { success: true, data: enrichedCandidates };
    } catch (err: any) {
        console.error("getChallengeCandidates error:", err);
        return { success: false, error: err.message || "Failed to fetch candidates" };
    }
}

/**
 * Assign an existing gym member to either 90_DAYS or 120_DAYS challenge.
 * Prevents simultaneously assigning to both challenges.
 */
export async function assignChallengeCandidate(
    memberId: string,
    challengeType: ChallengeType,
    startDate: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        // Check if member is already enrolled in any challenge
        const { data: existing, error: checkError } = await supabaseAdmin
            .from("pt_challenge_candidates")
            .select("id, challenge_type")
            .eq("member_id", memberId)
            .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
            throw checkError;
        }

        if (existing) {
            const existingLabel = existing.challenge_type === "90_DAYS" ? "90 Days" : "120 Days";
            const targetLabel = challengeType === "90_DAYS" ? "90 Days" : "120 Days";
            if (existing.challenge_type === challengeType) {
                return {
                    success: false,
                    error: `Candidate is already assigned to the ${existingLabel} Challenge.`,
                };
            } else {
                return {
                    success: false,
                    error: `Candidate is currently enrolled in the ${existingLabel} Challenge. To assign them to the ${targetLabel} Challenge, please remove them from the ${existingLabel} Challenge first.`,
                };
            }
        }

        const { data, error } = await supabaseAdmin
            .from("pt_challenge_candidates")
            .insert({
                member_id: memberId,
                challenge_type: challengeType,
                start_date: startDate || new Date().toLocaleDateString("en-CA"),
            })
            .select()
            .single();

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: "Member is already enrolled in a challenge." };
            }
            throw error;
        }

        revalidatePath("/admin/pt-measurements");
        return { success: true, data };
    } catch (err: any) {
        console.error("assignChallengeCandidate error:", err);
        return { success: false, error: err.message || "Failed to assign candidate" };
    }
}

/**
 * Remove a candidate from a challenge.
 * Preserves measurement history in pt_measurements linked to member_id.
 */
export async function removeChallengeCandidate(
    candidateId: string
): Promise<{ success: boolean; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        const { error } = await supabaseAdmin
            .from("pt_challenge_candidates")
            .delete()
            .eq("id", candidateId);

        if (error) throw error;

        revalidatePath("/admin/pt-measurements");
        return { success: true };
    } catch (err: any) {
        console.error("removeChallengeCandidate error:", err);
        return { success: false, error: err.message || "Failed to remove candidate" };
    }
}

// ---------------------------------------------------------------------------
// Measurement Tracking Actions
// ---------------------------------------------------------------------------

/**
 * Fetch all measurements for a member, sorted in measurement-day order (day_number ASC).
 */
export async function getPTMeasurements(
    memberId: string,
    challengeType?: ChallengeType
): Promise<PTMeasurementResult> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    try {
        let query = supabaseAdmin
            .from("pt_measurements")
            .select("*")
            .eq("member_id", memberId)
            .order("day_number", { ascending: true });

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data: (data || []) as PTMeasurement[] };
    } catch (err: any) {
        console.error("getPTMeasurements error:", err);
        return { success: false, error: err.message || "Failed to fetch measurements" };
    }
}

/**
 * Add a new measurement row with day limit enforcement (Day 1..90 or Day 1..120).
 */
export async function addPTMeasurement(
    memberId: string,
    dayNumber: number,
    weightKg: number | null,
    bmi: number | null,
    bodyFatPct: number | null,
    measuredAt: string,
    challengeType?: ChallengeType
): Promise<{ success: boolean; data?: PTMeasurement; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    const maxDay = challengeType === "90_DAYS" ? 90 : challengeType === "120_DAYS" ? 120 : 120;
    if (dayNumber < 1 || dayNumber > maxDay) {
        return {
            success: false,
            error: `Day number must be between 1 and ${maxDay} for this challenge.`,
        };
    }

    try {
        const { data, error } = await supabaseAdmin
            .from("pt_measurements")
            .insert({
                member_id: memberId,
                challenge_type: challengeType || null,
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
                return {
                    success: false,
                    error: `Day ${dayNumber} already exists for this candidate. Use a different day number or edit the existing record.`,
                };
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

/**
 * Update an existing measurement entry.
 */
export async function updatePTMeasurement(
    id: string,
    dayNumber: number,
    weightKg: number | null,
    bmi: number | null,
    bodyFatPct: number | null,
    measuredAt: string,
    challengeType?: ChallengeType
): Promise<{ success: boolean; error?: string }> {
    if (!supabaseAdmin) return { success: false, error: "Server configuration error" };

    const maxDay = challengeType === "90_DAYS" ? 90 : challengeType === "120_DAYS" ? 120 : 120;
    if (dayNumber < 1 || dayNumber > maxDay) {
        return {
            success: false,
            error: `Day number must be between 1 and ${maxDay} for this challenge.`,
        };
    }

    try {
        const updatePayload: any = {
            day_number: dayNumber,
            weight_kg: weightKg,
            bmi,
            body_fat_pct: bodyFatPct,
            measured_at: measuredAt,
        };

        if (challengeType) {
            updatePayload.challenge_type = challengeType;
        }

        const { error } = await supabaseAdmin
            .from("pt_measurements")
            .update(updatePayload)
            .eq("id", id);

        if (error) {
            if (error.code === "23505") {
                return { success: false, error: `Day ${dayNumber} already exists for this candidate.` };
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

/**
 * Delete an existing measurement entry.
 */
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

/**
 * Suggest next day number for a candidate (max existing + 1, capped at challenge limit).
 */
export async function getNextDayNumber(
    memberId: string,
    challengeType?: ChallengeType
): Promise<number> {
    const maxAllowed = challengeType === "90_DAYS" ? 90 : 120;
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
        const next = (data.day_number as number) + 1;
        return next > maxAllowed ? maxAllowed : next;
    } catch {
        return 1;
    }
}

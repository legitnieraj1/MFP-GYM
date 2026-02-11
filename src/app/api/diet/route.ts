import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Log user status for debugging
    console.log("Diet API - User:", user?.id || "Unauthenticated");

    if (!user) {
        return NextResponse.json({ message: "Unauthorized: Please log in." }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ message: "Server configuration error: Missing Service Role Key" }, { status: 500 });
    }

    try {
        const { weight, height, age, goal, vegNonVeg, targetUserId } = await req.json();

        // Determine which user to save for
        const targetId = targetUserId || user.id;

        // Step 1: Initial Reasoning and Analysis
        // We ask the model to think about the plan first.
        const initialPrompt = `
            Act as a professional expert nutritionist and gym trainer.
            I need to design a personalized Indian diet plan for a client with these stats:
            - Weight: ${weight} kg
            - Height: ${height} cm
            - Age: ${age} years
            - Goal: ${goal} (Cut/Bulk/Maintain)
            - Preference: ${vegNonVeg}

            Analyze their caloric needs (TDEE) and macronutrient split (Protein, Carbs, Fats).
            Think about appropriate Indian food sources for their preference.
            Outline a weekly meal plan structure.
        `;

        const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

        console.log("Using API Key:", openRouterKey ? openRouterKey.substring(0, 10) + "..." : "MISSING");

        if (!openRouterKey) {
            if (process.env.NODE_ENV === 'development') {
                console.warn("OPENROUTER_API_KEY missing. Using mock response.");
                return NextResponse.json({
                    weeklyPlan: "## Mock Plan (No API Key)\n\n**Note:** Add OPENROUTER_API_KEY to .env.local\n\n- Breakfast: Oats\n- Lunch: Rice & Dal",
                    calories: 2000,
                    protein: 100
                });
            }
            throw new Error("Missing OpenRouter API Key");
        }

        // Call 1: Generate reasoning (Analysis)
        const response1 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "openai/gpt-oss-120b:free", // As requested
                "messages": [
                    {
                        "role": "user",
                        "content": initialPrompt
                    }
                ],
                "reasoning": { "enabled": true }
            })
        });

        if (!response1.ok) {
            const err = await response1.text();
            console.error("OpenRouter API Error Response (Step 1):", err);
            console.error("OpenRouter API Status:", response1.status);

            if (response1.status === 404 && err.includes("data policy")) {
                return NextResponse.json({
                    message: "OpenRouter Policy Error: Please enable 'Allow data logging for free models' in your OpenRouter Privacy Settings to use this free model."
                }, { status: 400 });
            }

            // Should we return the error to the client to see?
            return NextResponse.json({ message: `AI API Error: ${err} (Status: ${response1.status})` }, { status: 500 });
        }

        const result1 = await response1.json();
        const assistantMessage1 = result1.choices[0].message;

        // Step 2: Force JSON Output based on the reasoning
        // We pass back the reasoning details to let the model use its thought process.
        const messages = [
            {
                role: 'user',
                content: initialPrompt,
            },
            {
                role: 'assistant',
                content: assistantMessage1.content,
                // @ts-ignore - OpenRouter specific field
                reasoning_details: assistantMessage1.reasoning_details,
            },
            {
                role: 'user',
                content: `
                    Based on your analysis, generate the final detailed Weekly Diet Plan.
                    
                    CRITICAL: Output ONLY valid JSON in the following format (no markdown code blocks, just raw JSON):
                    {
                        "weeklyPlan": "Markdown string of the formatted weekly plan (Mon-Sun)...",
                        "calories": Number,
                        "protein": Number
                    }
                `,
            },
        ];

        const response2 = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "openai/gpt-oss-120b:free",
                "messages": messages,
                // "response_format": { "type": "json_object" } // Some free models don't support this flag well, removing for safety
            })
        });

        if (!response2.ok) {
            const err = await response2.text();
            console.error("OpenRouter API Error Response (Step 2):", err);
            return NextResponse.json({ message: `AI API Error (Step 2): ${err}` }, { status: 500 });
        }

        const result2 = await response2.json();
        const content = result2.choices[0].message.content;

        let planData;
        try {
            // Clean content of markdown code blocks if present
            const cleanContent = content.replace(/```json\n?|```/g, "").trim();
            planData = JSON.parse(cleanContent);
        } catch (e) {
            console.error("Failed to parse JSON:", content);
            // Fallback if not JSON
            planData = {
                // If parsing fails, try to extract specific fields via regex or just return content
                weeklyPlan: content,
                calories: 0,
                protein: 0
            };
        }

        // Save to DB (Upsert diet plan)
        const { data: existing } = await supabaseAdmin
            .from("diet_plans")
            .select("id")
            .eq("user_id", targetId) // Use targetId (Member or Self)
            .single();

        if (existing) {
            await supabaseAdmin
                .from("diet_plans")
                .update({
                    content: planData.weeklyPlan,
                    calories: planData.calories,
                    protein: planData.protein
                })
                .eq("id", existing.id);
        } else {
            await supabaseAdmin
                .from("diet_plans")
                .insert({
                    user_id: targetId,
                    content: planData.weeklyPlan,
                    calories: planData.calories,
                    protein: planData.protein
                });
        }

        return NextResponse.json(planData);

    } catch (error: any) {
        console.error("AI Diet Gen Error:", error);
        return NextResponse.json({ message: error.message || "Failed to generate diet" }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSession } from "@/lib/session";

export async function POST(req: Request) {
    const session = await getSession();

    if (!session || !session.userId) {
        return NextResponse.json({ message: "Unauthorized: Please log in." }, { status: 401 });
    }

    if (!supabaseAdmin) {
        return NextResponse.json({ message: "Server configuration error" }, { status: 500 });
    }

    try {
        const { weight, height, age, goal, vegNonVeg } = await req.json();

        const targetId = session.userId;

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
                "HTTP-Referer": "www.mfpgympnp.in",
                "X-Title": "mfpgympnp"
            },
            body: JSON.stringify({
                "model": "arcee-ai/trinity-large-preview:free",
                "messages": [{ "role": "user", "content": initialPrompt }],
                "reasoning": { "enabled": true }
            })
        });

        if (!response1.ok) {
            const err = await response1.text();
            console.error("OpenRouter API Error (Step 1):", err);

            if (response1.status === 404 && err.includes("data policy")) {
                return NextResponse.json({
                    message: "OpenRouter Policy Error: Please enable 'Allow data logging for free models' in your OpenRouter Privacy Settings."
                }, { status: 400 });
            }

            return NextResponse.json({ message: `AI API Error: ${err} (Status: ${response1.status})` }, { status: 500 });
        }

        const result1 = await response1.json();
        const assistantMessage1 = result1.choices[0].message;

        // Call 2: Generate structured JSON plan
        const messages = [
            { role: 'user', content: initialPrompt },
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
                "HTTP-Referer": "www.mfpgympnp.in",
                "X-Title": "mfpgympnp"
            },
            body: JSON.stringify({
                "model": "arcee-ai/trinity-large-preview:free",
                "messages": messages,
            })
        });

        if (!response2.ok) {
            const err = await response2.text();
            console.error("OpenRouter API Error (Step 2):", err);
            return NextResponse.json({ message: `AI API Error (Step 2): ${err}` }, { status: 500 });
        }

        const result2 = await response2.json();
        const content = result2.choices[0].message.content;

        let planData;
        try {
            const cleanContent = content.replace(/```json\n?|```/g, "").trim();
            planData = JSON.parse(cleanContent);
        } catch {
            planData = {
                weeklyPlan: content,
                calories: 0,
                protein: 0
            };
        }

        return NextResponse.json(planData);

    } catch (error: any) {
        console.error("AI Diet Gen Error:", error);
        return NextResponse.json({ message: error.message || "Failed to generate diet" }, { status: 500 });
    }
}

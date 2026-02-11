"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Utensils } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

export default function DietPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<any>(null);
    const [user, setUser] = useState<any>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
            } else {
                setUser(user);
                // Optionally fetch existing plan?
                // For now, let's just let them generate.
            }
        };
        getUser();
    }, [router, supabase]);

    const [formData, setFormData] = useState({
        weight: "",
        height: "",
        age: "",
        goal: "MAINTAIN",
        vegNonVeg: "Non-Veg"
    });

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/diet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                setPlan(data);
            } else {
                console.error("Diet generation error:", data);
                alert(`Error: ${data.message || "Failed to generate diet"}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null; // or loading spinner

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />
            <div className="container mx-auto px-4 py-24">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-heading font-bold mb-8 text-center">AI <span className="text-[#E50914]">NUTRITIONIST</span></h1>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Form */}
                        <Card className="bg-zinc-900 border-zinc-800 h-fit">
                            <CardHeader>
                                <CardTitle className="text-white">Your Stats</CardTitle>
                                <CardDescription>Tell us about yourself to get a tailored plan.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleGenerate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Weight (kg)</label>
                                            <Input name="weight" type="number" required placeholder="70" className="bg-black/50 border-zinc-700" onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm text-gray-400">Height (cm)</label>
                                            <Input name="height" type="number" required placeholder="175" className="bg-black/50 border-zinc-700" onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Age</label>
                                        <Input name="age" type="number" required placeholder="25" className="bg-black/50 border-zinc-700" onChange={handleChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Goal</label>
                                        <select name="goal" className="w-full bg-black/50 border border-zinc-700 rounded-md p-2 text-sm text-white" onChange={handleChange}>
                                            <option value="MAINTAIN">Maintain Weight</option>
                                            <option value="CUT">Weight Loss (Cut)</option>
                                            <option value="BULK">Muscle Gain (Bulk)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Diet Type</label>
                                        <select name="vegNonVeg" className="w-full bg-black/50 border border-zinc-700 rounded-md p-2 text-sm text-white" onChange={handleChange}>
                                            <option value="Non-Veg">Non-Vegetarian</option>
                                            <option value="Veg">Vegetarian</option>
                                            <option value="Vegan">Vegan</option>
                                        </select>
                                    </div>

                                    <Button type="submit" className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold shadow-[0_0_15px_-5px_#E50914]" disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generate Plan
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Result */}
                        <div className="relative">
                            {plan ? (
                                <Card className="bg-zinc-900 border-zinc-800 animate-fade-in-up">
                                    <CardHeader>
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <Utensils className="text-[#E50914]" /> Your Weekly Plan
                                        </CardTitle>
                                        <div className="flex gap-4 text-sm text-gray-400 mt-2">
                                            <span className="bg-black/30 px-2 py-1 rounded">Calories: {plan.calories}</span>
                                            <span className="bg-black/30 px-2 py-1 rounded">Protein: {plan.protein}g</span>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {plan.weeklyPlan.split('\n').map((line: string, index: number) => {
                                                // Heading 2 (##)
                                                if (line.trim().startsWith('##')) {
                                                    return (
                                                        <h3 key={index} className="text-xl font-bold text-[#E50914] mt-6 mb-2 border-b border-zinc-800 pb-2">
                                                            {line.replace(/^##\s+/, '').replace(/\*\*/g, '')}
                                                        </h3>
                                                    );
                                                }
                                                // Heading 3 (###)
                                                if (line.trim().startsWith('###')) {
                                                    return (
                                                        <h4 key={index} className="text-lg font-semibold text-white mt-4 mb-2">
                                                            {line.replace(/^###\s+/, '').replace(/\*\*/g, '')}
                                                        </h4>
                                                    );
                                                }
                                                // Bold headers (e.g. **Breakfast**)
                                                if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                                                    return (
                                                        <h4 key={index} className="text-md font-bold text-zinc-200 mt-4 mb-1">
                                                            {line.replace(/\*\*/g, '')}
                                                        </h4>
                                                    );
                                                }
                                                // List items
                                                if (line.trim().startsWith('-')) {
                                                    return (
                                                        <div key={index} className="flex items-start gap-2 ml-2 text-zinc-300">
                                                            <span className="text-[#E50914] mt-1.5">•</span>
                                                            <p className="flex-1 leading-relaxed">
                                                                {line.replace(/^- /, '').split('**').map((part, i) =>
                                                                    i % 2 === 1 ? <span key={i} className="font-semibold text-white">{part}</span> : part
                                                                )}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                // Empty lines
                                                if (!line.trim()) {
                                                    return <div key={index} className="h-2"></div>;
                                                }
                                                // Regular text
                                                return (
                                                    <p key={index} className="text-zinc-400">
                                                        {line.split('**').map((part, i) =>
                                                            i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
                                                        )}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 border border-dashed border-zinc-800 rounded-lg text-center">
                                    <Utensils className="w-12 h-12 text-zinc-700 mb-4" />
                                    <p className="text-zinc-500">Fill the form and hit Generate to see your personalized Indian diet plan.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

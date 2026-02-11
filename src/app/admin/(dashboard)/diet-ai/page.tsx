"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bot, Sparkles, Loader2, Save } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

export default function DietAIPage() {
    const [generating, setGenerating] = useState(false);
    const [plan, setPlan] = useState("");
    const [members, setMembers] = useState<any[]>([]);

    // Define stats state correctly
    const [stats, setStats] = useState({
        memberId: "",
        age: "25",
        gender: "male",
        weight: "75",
        height: "175",
        goal: "MAINTAIN",
        dietType: "Non-Veg"
    });

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const fetchMembers = async () => {
            const { data, error } = await supabase
                .from("users")
                .select("id, name, email")
                .neq("role", "ADMIN") // Optional: filter out admins if desired
                .order("name", { ascending: true });

            if (data) {
                console.log("Fetched members:", data.length);
                setMembers(data);
            }
        };
        fetchMembers();
    }, [supabase]);

    const handleChange = (field: string, value: string) => {
        setStats(prev => ({ ...prev, [field]: value }));
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setPlan("");

        try {
            // Include memberId in the request if needed, or just use the stats for generation
            const res = await fetch("/api/diet", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weight: stats.weight,
                    height: stats.height,
                    age: stats.age,
                    goal: stats.goal,
                    vegNonVeg: stats.dietType,
                    // We could also pass memberId to save it directly to their profile in the future
                    targetUserId: stats.memberId
                })
            });

            const data = await res.json();

            if (res.ok) {
                setPlan(data.weeklyPlan);
            } else {
                setPlan(`Error: ${data.message || "Failed to generate"}`);
            }
        } catch (err) {
            console.error(err);
            setPlan("Error generating plan. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
                    <Bot className="text-[#E50914]" size={32} /> Diet AI Assistant
                </h1>
                <p className="text-muted-foreground">Generate personalized meal plans using AI (OpenRouter).</p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Member Details</CardTitle>
                        <CardDescription className="text-zinc-500">Select a member and input stats to generate a plan</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Member</Label>
                                <Select value={stats.memberId} onValueChange={(val) => handleChange("memberId", val)}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="Select a member" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-[200px] z-[100]">
                                        {members.map((m) => (
                                            <SelectItem key={m.id} value={m.id} className="focus:bg-zinc-800 focus:text-white">
                                                {m.name || m.email || "Unknown User"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Age</Label>
                                    <Input
                                        type="number"
                                        value={stats.age}
                                        onChange={(e) => handleChange("age", e.target.value)}
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gender</Label>
                                    <Select value={stats.gender} onValueChange={(val) => handleChange("gender", val)}>
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white z-[100]">
                                            <SelectItem value="male" className="focus:bg-zinc-800 focus:text-white">Male</SelectItem>
                                            <SelectItem value="female" className="focus:bg-zinc-800 focus:text-white">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        value={stats.weight}
                                        onChange={(e) => handleChange("weight", e.target.value)}
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Height (cm)</Label>
                                    <Input
                                        type="number"
                                        value={stats.height}
                                        onChange={(e) => handleChange("height", e.target.value)}
                                        className="bg-zinc-950 border-zinc-800"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Goal</Label>
                                <Select value={stats.goal} onValueChange={(val) => handleChange("goal", val)}>
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white z-[100]">
                                        <SelectItem value="CUT" className="focus:bg-zinc-800 focus:text-white">Weight Loss (Cut)</SelectItem>
                                        <SelectItem value="MAINTAIN" className="focus:bg-zinc-800 focus:text-white">Maintenance</SelectItem>
                                        <SelectItem value="BULK" className="focus:bg-zinc-800 focus:text-white">Muscle Gain (Bulk)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Dietary Preferences</Label>
                                <Input
                                    placeholder="e.g. Non-Veg, Vegetarian"
                                    value={stats.dietType}
                                    onChange={(e) => handleChange("dietType", e.target.value)}
                                    className="bg-zinc-950 border-zinc-800"
                                />
                            </div>
                            <Button type="submit" disabled={generating} className="w-full bg-[#E50914] hover:bg-[#E50914]/90 text-white shadow-[0_0_15px_-5px_#E50914]">
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Plan... (Reasoning)
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" /> Generate Diet Plan
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800 h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-white flex justify-between items-center">
                            Generated Plan
                            <Button variant="outline" size="sm" className="hidden border-zinc-700 text-zinc-300">
                                <Save className="mr-2 h-4 w-4" /> Save to Profile
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        {plan ? (
                            <div className="h-full flex flex-col gap-4">
                                <div className="flex-1 p-4 rounded-md bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-sm whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-[600px]">
                                    {plan.replace(/\\n/g, '\n')}
                                </div>
                                <div className="flex gap-3">
                                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                        Assign to Member
                                    </Button>
                                    <Button variant="outline" className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                        Download PDF
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 min-h-[300px]">
                                <Bot size={48} className="opacity-20" />
                                <p>Fill user details and click generate to see the plan here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

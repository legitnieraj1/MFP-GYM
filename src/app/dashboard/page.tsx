import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, CreditCard, Apple, Calendar } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

export default async function DashboardPage() {
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

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile data
    const { data: userProfile, error } = await supabase
        .from("users")
        .select(`
            *,
            membership:memberships(*),
            diet_plan:diet_plans(*)
        `)
        .eq("id", user.id)
        .single();

    if (error || !userProfile) {
        return <div>Error loading profile. Please contact support.</div>;
    }

    // Handle array or single object for relationships if needed (Supabase returns arrays for 1:many usually, but single() if 1:1)
    const membership = Array.isArray(userProfile.membership) ? userProfile.membership[0] : userProfile.membership;
    const dietPlan = Array.isArray(userProfile.diet_plan) ? userProfile.diet_plan[0] : userProfile.diet_plan;

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar />

            <div className="container mx-auto px-4 py-24">
                <h1 className="text-4xl font-heading font-bold mb-8">
                    WELCOME BACK, <span className="text-[#E50914] uppercase">{userProfile.name}</span>
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl font-bold text-white">Profile</CardTitle>
                            <User className="h-5 w-5 text-[#E50914]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between">
                                    <span>Email:</span>
                                    <span className="font-medium text-white">{userProfile.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Phone:</span>
                                    <span className="font-medium text-white">{userProfile.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Age:</span>
                                    <span className="font-medium text-white">{userProfile.age}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Weight:</span>
                                    <span className="font-medium text-white">{userProfile.weight} kg</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Height:</span>
                                    <span className="font-medium text-white">{userProfile.height} cm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Goal:</span>
                                    <span className="font-medium text-[#E50914]">{userProfile.body_goal}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Membership Card */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl font-bold text-white">Membership</CardTitle>
                            <CreditCard className="h-5 w-5 text-[#E50914]" />
                        </CardHeader>
                        <CardContent>
                            {membership ? (
                                <div className="space-y-4">
                                    <div className="text-2xl font-bold text-white">{membership.plan} PLAN</div>
                                    <div className="text-sm text-gray-300">
                                        <div>Status: <span className={membership.status === 'ACTIVE' ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{membership.status}</span></div>
                                        <div>Ends: {new Date(membership.end_date).toLocaleDateString()}</div>
                                    </div>
                                    <Button variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">Manage Subscription</Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-gray-400">No active membership found.</p>
                                    <Button asChild className="w-full bg-[#E50914] text-white hover:bg-[#E50914]/90">
                                        <Link href="/#plans">View Plans</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Diet Plan Card */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl font-bold text-white">Diet Plan</CardTitle>
                            <Apple className="h-5 w-5 text-[#E50914]" />
                        </CardHeader>
                        <CardContent>
                            {dietPlan ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-black/50 rounded border border-white/5 text-sm text-gray-300 line-clamp-4">
                                        {/* Simplified display of diet plan content */}
                                        {dietPlan.content.substring(0, 100)}...
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                                        <div>Calories: <span className="text-white">{dietPlan.calories}</span></div>
                                        <div>Protein: <span className="text-white">{dietPlan.protein}g</span></div>
                                    </div>
                                    <Button asChild variant="outline" className="w-full border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800">
                                        <Link href="/diet">View Full Plan</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-gray-400">No personalized diet plan yet.</p>
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                        <Link href="/diet">Generate AI Diet</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Attendance (Optional/Future) */}
                <div className="mt-8">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#E50914]" /> Recent Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Check-in history will appear here once you start visiting the gym.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

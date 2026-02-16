import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { supabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { User, CreditCard, Apple, Calendar, Phone, Shield } from "lucide-react";

export default async function DashboardPage() {
    const session = await getSession();

    if (!session?.userId) {
        redirect("/login");
    }

    if (!supabaseAdmin) {
        return <div>Configuration error.</div>
    }

    // Fetch member profile from the members table
    const { data: memberProfile, error } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("id", session.userId)
        .single();

    if (error || !memberProfile) {
        return (
            <div className="min-h-screen bg-black text-white">
                <Navbar session={session} />
                <div className="container mx-auto px-4 py-24 text-center">
                    <h1 className="text-3xl font-bold text-red-500 mb-4">Profile Not Found</h1>
                    <p className="text-zinc-400 mb-8">We couldn&apos;t load your profile. Please try logging in again.</p>
                    <Link href="/login">
                        <Button className="bg-red-600 hover:bg-red-700">Login Again</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isActive = memberProfile.membership_end
        ? new Date(memberProfile.membership_end) > new Date()
        : false;

    return (
        <div className="min-h-screen bg-black text-white">
            <Navbar session={session} />

            <div className="container mx-auto px-4 py-24">
                <h1 className="text-4xl font-heading font-bold mb-8">
                    WELCOME BACK, <span className="text-[#E50914] uppercase">{memberProfile.name}</span>
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Card */}
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl font-bold text-white">Profile</CardTitle>
                            <User className="h-5 w-5 text-[#E50914]" />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-gray-300">
                                <div className="flex justify-between">
                                    <span>Name:</span>
                                    <span className="font-medium text-white">{memberProfile.name}</span>
                                </div>
                                {memberProfile.age && (
                                    <div className="flex justify-between">
                                        <span>Age:</span>
                                        <span className="font-medium text-white">{memberProfile.age}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span>Mobile:</span>
                                    <span className="font-medium text-white">{memberProfile.mobile}</span>
                                </div>
                                {memberProfile.enroll_no && (
                                    <div className="flex justify-between">
                                        <span>Enroll No:</span>
                                        <span className="font-medium text-white">{memberProfile.enroll_no}</span>
                                    </div>
                                )}
                                {memberProfile.legacy_member && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-amber-400 bg-amber-900/20 p-2 rounded">
                                        <Shield className="h-3 w-3" />
                                        Legacy Member
                                    </div>
                                )}
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
                            {memberProfile.membership_start ? (
                                <div className="space-y-4">
                                    <div className={`text-2xl font-bold ${isActive ? 'text-green-500' : 'text-red-500'}`}>
                                        {isActive ? 'ACTIVE' : 'EXPIRED'}
                                    </div>
                                    <div className="text-sm text-gray-300 space-y-1">
                                        <div>Start: {new Date(memberProfile.membership_start).toLocaleDateString()}</div>
                                        {memberProfile.membership_end && (
                                            <div>End: {new Date(memberProfile.membership_end).toLocaleDateString()}</div>
                                        )}
                                    </div>
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
                            <div className="space-y-4">
                                <p className="text-gray-400">No personalized diet plan yet.</p>
                                <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                    <Link href="/diet">Generate AI Diet</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
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

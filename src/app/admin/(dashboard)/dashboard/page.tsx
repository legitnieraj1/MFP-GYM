"use client";

import { useEffect, useState } from "react";
import { Users, UserPlus, Clock, TrendingUp, Bell, UserCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMembers, getAttendance, getPayments } from "@/app/actions/admin";

import { useRouter } from "next/navigation";

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalMembers: 0,
        activeNow: 0,
        expiringSoon: 0,
        todayRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            const [membersRes, attendanceRes, paymentsRes] = await Promise.all([
                getMembers(),
                getAttendance(),
                getPayments()
            ]);

            const members = membersRes.success && membersRes.data ? membersRes.data : [];
            const attendance = attendanceRes.success && attendanceRes.data ? attendanceRes.data : [];
            const payments = paymentsRes.success && paymentsRes.data ? paymentsRes.data : [];

            // Calculate stats
            const totalMembers = members.length;
            // Mocking "Active Now" based on recent check-ins within last 2 hours
            const activeNow = attendance.filter((a: any) => {
                const checkIn = new Date(a.check_in_time);
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
                return checkIn > twoHoursAgo;
            }).length;

            const expiringSoon = members.filter((m: any) => {
                if (!m.membership) return false;
                const endDate = new Date(m.membership.end_date);
                const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return endDate > new Date() && endDate < sevenDaysFromNow;
            }).length;

            const todayRevenue = payments
                .filter((p: any) => {
                    const paymentDate = new Date(p.created_at);
                    const today = new Date();
                    return paymentDate.getDate() === today.getDate() &&
                        paymentDate.getMonth() === today.getMonth() &&
                        paymentDate.getFullYear() === today.getFullYear();
                })
                .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

            setStats({
                totalMembers,
                activeNow,
                expiringSoon,
                todayRevenue
            });
            setLoading(false);
        }

        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your gym&apos;s performance today.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push('/admin/members')} // Using router.push for client-side nav
                        className="px-4 py-2 bg-[#E50914] text-white rounded-lg font-bold hover:bg-[#E50914]/90 transition-colors shadow-[0_0_15px_-5px_#E50914] flex items-center gap-2"
                    >
                        <UserPlus size={18} /> Add Member
                    </button>
                    <button
                        onClick={() => alert("Broadcast feature coming soon! (v3.0)")}
                        className="px-4 py-2 bg-zinc-800 text-white rounded-lg font-bold hover:bg-zinc-700 transition-colors border border-white/10 flex items-center gap-2"
                    >
                        <Bell size={18} /> BroadCast
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-zinc-900 border-zinc-800 hover:border-[#E50914]/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Members</CardTitle>
                        <Users className="h-4 w-4 text-[#E50914]" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{loading ? "..." : stats.totalMembers}</div>
                        <p className="text-xs text-zinc-500">+12% from last month</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-[#E50914]/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Active Now</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{loading ? "..." : stats.activeNow}</div>
                        <p className="text-xs text-zinc-500">Currently in gym</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-[#E50914]/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Expiring Soon</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{loading ? "..." : stats.expiringSoon}</div>
                        <p className="text-xs text-zinc-500">Within next 7 days</p>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 hover:border-[#E50914]/50 transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Today&apos;s Revenue</CardTitle>
                        <div className="font-bold text-[#E50914]">Rs.</div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{loading ? "..." : `Rs. ${stats.todayRevenue.toLocaleString()}`}</div>
                        <p className="text-xs text-zinc-500">Daily earnings</p>
                    </CardContent>
                </Card>
            </div>

            {/* Content Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity */}
                <Card className="col-span-4 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Live Activity Feed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {[
                                { name: "Ravi Kumar", action: "checked in", time: "2 mins ago", type: "checkin" },
                                { name: "Ananya S", action: "renewed membership", time: "15 mins ago", type: "payment" },
                                { name: "Karthik", action: "joined as new member", time: "42 mins ago", type: "join" },
                                { name: "Sarah", action: "checked out", time: "1 hour ago", type: "checkout" },
                                { name: "Arjun Reddy", action: "payment failed", time: "2 hours ago", type: "alert" },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center">
                                    <div className={`h-9 w-9 rounded-full flex items-center justify-center border border-white/10 ${item.type === 'checkin' ? 'bg-green-500/10 text-green-500' :
                                        item.type === 'payment' ? 'bg-blue-500/10 text-blue-500' :
                                            item.type === 'alert' ? 'bg-red-500/10 text-red-500' :
                                                'bg-zinc-800 text-white'
                                        }`}>
                                        {item.type === 'checkin' ? <UserCheck size={16} /> :
                                            item.type === 'alert' ? <AlertTriangle size={16} /> :
                                                <Clock size={16} />}
                                    </div>
                                    <div className="ml-4 space-y-1">
                                        <p className="text-sm font-medium leading-none text-white">
                                            {item.name} <span className="text-zinc-500 font-normal">{item.action}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground">{item.time}</p>
                                    </div>
                                    <div className="ml-auto font-medium text-xs text-zinc-500">
                                        {item.type === 'payment' ? "+ Rs. 4,500" : ""}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Signups / Alerts */}
                <Card className="col-span-3 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Expiring Approaching</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-zinc-800" />
                                        <div>
                                            <div className="text-sm font-medium text-white">Member Name</div>
                                            <div className="text-xs text-red-400">Expires in 2 days</div>
                                        </div>
                                    </div>
                                    <button className="text-xs bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white transition-colors">
                                        Remind
                                    </button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

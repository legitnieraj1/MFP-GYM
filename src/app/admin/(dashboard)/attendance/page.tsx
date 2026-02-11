"use client";

import { useState, useEffect } from "react";
import { getAttendance } from "@/app/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Search, Download, Wifi } from "lucide-react";

type AttendanceRecord = {
    id: string;
    check_in_time: string;
    user: {
        name: string;
        photo: string | null;
        email: string;
    };
};

export default function AttendancePage() {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const res = await getAttendance();
            if (res.success && res.data) {
                setAttendance(res.data as unknown as AttendanceRecord[]);
            }
            setLoading(false);
        }
        fetch();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Attendance & NFC</h1>
                    <p className="text-muted-foreground">Monitor real-time gym access and check-ins.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800">
                        <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                    <Button className="bg-[#E50914] text-white hover:bg-[#E50914]/90">
                        <Wifi className="mr-2 h-4 w-4" /> NFC Reader Active
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Check-ins Today</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{attendance.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Peak Hour</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">6:00 PM</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Average Duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">75 min</div>
                    </CardContent>
                </Card>
            </div>

            {/* Attendance List */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                        <span>Today's Log</span>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input placeholder="Search logs..." className="pl-10 h-9 bg-black/50 border-zinc-800" />
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8 text-zinc-500">Loading attendance data...</div>
                        ) : attendance.length === 0 ? (
                            <div className="text-center py-8 text-zinc-500">No check-ins recorded today.</div>
                        ) : (
                            attendance.map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-4 rounded-lg bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-zinc-800 flex overflow-hidden">
                                            {record.user?.photo ? (
                                                <img src={record.user.photo} alt={record.user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="m-auto text-zinc-500 text-xs">IMG</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{record.user?.name || "Unknown"}</div>
                                            <div className="text-xs text-zinc-500">{record.user?.email || "-"}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-medium border border-green-500/20">
                                            Checked In
                                        </div>
                                        <div className="text-sm font-medium text-zinc-300">
                                            {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

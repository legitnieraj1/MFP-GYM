import { getTodaysLog } from "@/app/actions/attendance";
import { format } from "date-fns";
import { User, ArrowDownLeft, ArrowUpRight, Calendar, Clock } from "lucide-react";

export default async function AttendancePage() {
    const logs = await getTodaysLog();
    const today = new Date();

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bebas tracking-wide text-white">Today's Log</h1>
                    <p className="text-zinc-400 mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3">
                        <div className="bg-green-500/10 p-2 rounded-full">
                            <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold">In Gym</p>
                            <p className="text-xl font-bold text-white leading-none">
                                {logs.filter(l => !l.check_out_time).length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 flex items-center gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-full">
                            <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-zinc-500 uppercase font-bold">Completed</p>
                            <p className="text-xl font-bold text-white leading-none">
                                {logs.filter(l => l.check_out_time).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A] overflow-hidden">
                <div className="grid grid-cols-4 gap-4 p-4 border-b border-zinc-800 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    <div className="col-span-1">Member</div>
                    <div className="col-span-1">Check In</div>
                    <div className="col-span-1">Check Out</div>
                    <div className="col-span-1 text-right">Status</div>
                </div>

                {logs.length === 0 ? (
                    <div className="p-12 flex flex-col items-center justify-center text-zinc-500 gap-2">
                        <Clock className="h-8 w-8 opacity-20" />
                        <p>No activity yet today</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-800/50">
                        {logs.map((log: any) => (
                            <div key={log.id} className="grid grid-cols-4 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                                <div className="col-span-1 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700">
                                        {log.users?.photo ? (
                                            <img src={log.users.photo} alt={log.users.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-4 w-4 text-zinc-500" />
                                        )}
                                    </div>
                                    <span className="font-medium text-white">{log.users?.name || "Unknown User"}</span>
                                </div>
                                <div className="col-span-1 text-zinc-300 font-mono text-sm">
                                    {new Date(log.check_in_time).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true })}
                                </div>
                                <div className="col-span-1 text-zinc-300 font-mono text-sm">
                                    {log.check_out_time ? new Date(log.check_out_time).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }) : "-"}
                                </div>
                                <div className="col-span-1 flex justify-end">
                                    {log.check_out_time ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                            Completed
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20 animate-pulse">
                                            Active
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

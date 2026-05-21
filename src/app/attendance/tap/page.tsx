"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "@/app/actions/attendance";
import { Loader2, CheckCircle, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type TapStatus = "LOADING" | "SUCCESS" | "ERROR";

export default function TapPage() {
    const router = useRouter();
    const [status, setStatus] = useState<TapStatus>("LOADING");
    const [message, setMessage] = useState("");
    const [details, setDetails] = useState<{
        type: string;
        name?: string;
        time?: string;
    } | null>(null);

    // Prevent double-fire in React Strict Mode
    const hasFired = useRef(false);

    const processTap = async () => {
        try {
            const res = await markAttendance();
            if (res.success && res.status) {
                setStatus("SUCCESS");
                setDetails({
                    type: res.status,
                    name: res.name || "Member",
                    time: res.time,
                });
            } else if (res.error === "Not authenticated") {
                // Middleware should have caught this, but just in case
                router.replace("/login?redirect=/attendance/tap");
            } else {
                setStatus("ERROR");
                setMessage(res.error || "Something went wrong");
            }
        } catch {
            setStatus("ERROR");
            setMessage("Network error — please try again");
        }
    };

    useEffect(() => {
        // Middleware already guarantees the user is authenticated if they reach here.
        // Fire immediately — no need to wait for AuthContext's /api/auth/me round trip.
        if (hasFired.current) return;
        hasFired.current = true;
        processTap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (status === "LOADING") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#E50914] mb-4" />
                <h1 className="text-xl font-bebas tracking-wider animate-pulse">
                    Processing Tap...
                </h1>
            </div>
        );
    }

    if (status === "ERROR") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
                <div className="bg-red-500/10 p-6 rounded-full mb-6 ring-1 ring-red-500/50">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bebas mb-2 text-red-500">Tap Failed</h1>
                <p className="text-zinc-400 mb-8 max-w-xs">{message}</p>
                <div className="flex gap-4">
                    <Link href="/dashboard">
                        <Button
                            variant="outline"
                            className="border-zinc-800 text-white hover:bg-zinc-900"
                        >
                            Go to Dashboard
                        </Button>
                    </Link>
                    <Button
                        className="bg-[#E50914] text-white hover:bg-[#E50914]/90"
                        onClick={() => {
                            setStatus("LOADING");
                            setMessage("");
                            processTap();
                        }}
                    >
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    const isCheckIn = details?.type === "CHECK_IN";
    const color = isCheckIn ? "green" : "blue";

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center relative overflow-hidden">
            <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 pointer-events-none bg-${color}-500`}
            />

            <div
                className={`p-6 rounded-full mb-6 ring-2 ring-offset-4 ring-offset-black bg-${color}-500/10 ring-${color}-500`}
            >
                {isCheckIn ? (
                    <CheckCircle className={`h-16 w-16 text-${color}-500`} />
                ) : (
                    <LogOut className={`h-16 w-16 text-${color}-500`} />
                )}
            </div>

            <h1 className="text-5xl font-bebas mb-2 uppercase">
                {isCheckIn ? "Welcome!" : "Goodbye!"}
            </h1>
            <h2 className="text-2xl font-bold text-zinc-300 mb-4">{details?.name}</h2>

            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 px-8 py-4 rounded-xl mb-8">
                <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">
                    {isCheckIn ? "Check In Time" : "Check Out Time"}
                </p>
                <p className="text-3xl font-mono text-white">
                    {details?.time || new Date().toLocaleTimeString()}
                </p>
            </div>

            {details?.type === "ALREADY_COMPLETED" && (
                <p className="text-zinc-500 bg-zinc-900 px-4 py-2 rounded-lg mb-8">
                    You have already checked out for today.
                </p>
            )}

            <Button
                onClick={() => router.push("/dashboard")}
                variant="ghost"
                className="text-zinc-400 hover:text-white"
            >
                Back to Dashboard
            </Button>
        </div>
    );
}

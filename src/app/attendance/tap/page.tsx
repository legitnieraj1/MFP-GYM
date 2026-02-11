"use client";

import { useEffect, useState } from "react";
import { markAttendance } from "@/app/actions/attendance";
import { Loader2, CheckCircle, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TapPage() {
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [message, setMessage] = useState("");
    const [details, setDetails] = useState<{ type: string, name?: string, time?: string } | null>(null);

    useEffect(() => {
        const processTap = async () => {
            try {
                const res = await markAttendance();
                if (res.success && res.status) {
                    setStatus('SUCCESS');
                    setDetails({
                        type: res.status,
                        name: res.name || "Member",
                        time: res.time
                    });
                } else {
                    setStatus('ERROR');
                    setMessage(res.error || "Something went wrong");
                }
            } catch (err) {
                setStatus('ERROR');
                setMessage("Network error");
            }
        };

        processTap();
    }, []);

    if (status === 'LOADING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#E50914] mb-4" />
                <h1 className="text-xl font-bebas tracking-wider animate-pulse">Processing Tap...</h1>
            </div>
        );
    }

    if (status === 'ERROR') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center">
                <div className="bg-red-500/10 p-6 rounded-full mb-6 ring-1 ring-red-500/50">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="text-3xl font-bebas mb-2 text-red-500">Tap Failed</h1>
                <p className="text-zinc-400 mb-8 max-w-xs">{message}</p>

                <div className="flex gap-4">
                    <Link href="/">
                        <Button variant="outline" className="border-zinc-800 text-white hover:bg-zinc-900">
                            Go Home
                        </Button>
                    </Link>
                    <Link href="/login">
                        <Button className="bg-[#E50914] text-white hover:bg-[#E50914]/90">
                            Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 pointer-events-none ${details?.type === 'CHECK_IN' ? 'bg-green-500' : 'bg-blue-500'}`} />

            <div className={`p-6 rounded-full mb-6 ring-2 ring-offset-4 ring-offset-black ${details?.type === 'CHECK_IN' ? 'bg-green-500/10 ring-green-500' : 'bg-blue-500/10 ring-blue-500'}`}>
                {details?.type === 'CHECK_IN' ? (
                    <CheckCircle className={`h-16 w-16 ${details?.type === 'CHECK_IN' ? 'text-green-500' : 'text-blue-500'}`} />
                ) : (
                    <LogOut className={`h-16 w-16 ${details?.type === 'CHECK_IN' ? 'text-green-500' : 'text-blue-500'}`} />
                )}
            </div>

            <h1 className="text-5xl font-bebas mb-2 uppercase">
                {details?.type === 'CHECK_IN' ? 'Welcome!' : 'Goodbye!'}
            </h1>
            <h2 className="text-2xl font-bold text-zinc-300 mb-4">{details?.name}</h2>

            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800 px-8 py-4 rounded-xl mb-8">
                <p className="text-zinc-500 text-sm uppercase tracking-widest mb-1">
                    {details?.type === 'CHECK_IN' ? 'Check In Time' : 'Check Out Time'}
                </p>
                <p className="text-3xl font-mono text-white">
                    {details?.time || new Date().toLocaleTimeString()}
                </p>
            </div>

            {details?.type === 'ALREADY_COMPLETED' && (
                <p className="text-zinc-500 bg-zinc-900 px-4 py-2 rounded-lg mb-8">
                    You have already checked out for today.
                </p>
            )}

            <Button onClick={() => window.location.href = '/'} variant="ghost" className="text-zinc-400 hover:text-white">
                Back to Dashboard
            </Button>
        </div>
    );
}

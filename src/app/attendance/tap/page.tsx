"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { markAttendance } from "@/app/actions/attendance";
import { Loader2, Check, LogOut, AlertCircle, Flame, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type TapStatus = "LOADING" | "SUCCESS" | "ERROR";
type ResultType = "CHECK_IN" | "CHECK_OUT" | "ALREADY_COMPLETED";

// --- Small synthesized sound effect (no audio asset needed). -----------------
// Rising chime for check-in, soft falling tones for check-out. Browsers may
// block audio without an in-page gesture; we fail silently if so.
function playTone(kind: ResultType) {
    try {
        const AC =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
        if (!AC) return;
        const ctx = new AC();
        const now = ctx.currentTime;
        const notes =
            kind === "CHECK_IN"
                ? [523.25, 659.25, 783.99] // C5 E5 G5 — bright, rising
                : kind === "CHECK_OUT"
                ? [659.25, 523.25, 392.0] // E5 C5 G4 — gentle, falling
                : [440, 440]; // neutral

        notes.forEach((f, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = f;
            const t = now + i * 0.11;
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(t);
            osc.stop(t + 0.22);
        });
        setTimeout(() => ctx.close(), 900);
    } catch {
        /* audio blocked — ignore */
    }
}

function vibrate(kind: ResultType) {
    try {
        if (!("vibrate" in navigator)) return;
        navigator.vibrate(kind === "CHECK_IN" ? [12, 40, 18] : [20]);
    } catch {
        /* ignore */
    }
}

export default function TapPage() {
    const router = useRouter();
    const [status, setStatus] = useState<TapStatus>("LOADING");
    const [message, setMessage] = useState("");
    const [details, setDetails] = useState<{
        type: ResultType;
        name?: string;
        time?: string;
    } | null>(null);

    // Prevent double-fire in React Strict Mode
    const hasFired = useRef(false);

    const processTap = async () => {
        try {
            const res = await markAttendance();
            if (res.success && res.status) {
                const type = res.status as ResultType;
                setStatus("SUCCESS");
                setDetails({ type, name: res.name || "Member", time: res.time });
                playTone(type);
                vibrate(type);
            } else if (res.error === "Not authenticated") {
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
        if (hasFired.current) return;
        hasFired.current = true;
        processTap();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Auto-return to dashboard after celebrating.
    useEffect(() => {
        if (status !== "SUCCESS") return;
        const t = setTimeout(() => router.push("/dashboard"), 5000);
        return () => clearTimeout(t);
    }, [status, router]);

    if (status === "LOADING") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-white">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-[#E50914]" />
                <h1 className="animate-pulse font-bebas text-xl tracking-wider">
                    Processing Tap...
                </h1>
            </div>
        );
    }

    if (status === "ERROR") {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-center text-white">
                <div className="mb-6 rounded-full bg-red-500/10 p-6 ring-1 ring-red-500/50">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                </div>
                <h1 className="mb-2 font-bebas text-3xl text-red-500">Tap Failed</h1>
                <p className="mb-8 max-w-xs text-zinc-400">{message}</p>
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

    // --- SUCCESS -------------------------------------------------------------
    const type: ResultType = details?.type || "CHECK_IN";
    const isCheckIn = type === "CHECK_IN";
    const isCheckOut = type === "CHECK_OUT";
    const isDone = type === "ALREADY_COMPLETED";

    const theme = isCheckIn
        ? {
              glow: "#22c55e",
              ring: "ring-green-500",
              iconBg: "bg-green-500",
              text: "text-green-400",
              title: "You're In!",
              sub: "Have a great workout",
              timeLabel: "Check-In Time",
          }
        : isCheckOut
        ? {
              glow: "#f59e0b",
              ring: "ring-amber-500",
              iconBg: "bg-amber-500",
              text: "text-amber-400",
              title: "Great Work!",
              sub: "See you next time",
              timeLabel: "Check-Out Time",
          }
        : {
              glow: "#64748b",
              ring: "ring-zinc-500",
              iconBg: "bg-zinc-600",
              text: "text-zinc-300",
              title: "All Done Today",
              sub: "You've already checked out",
              timeLabel: "Checked Out At",
          };

    const Icon = isCheckIn ? Check : isCheckOut ? LogOut : Flame;

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-black p-4 text-center text-white">
            {/* animated ambient glow */}
            <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 0.25, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
                style={{ background: theme.glow }}
            />

            {/* badge */}
            <div className="relative mb-8">
                {/* pulsing rings */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                    className={`absolute inset-0 rounded-full ring-2 ${theme.ring}`}
                />
                <motion.div
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className={`relative flex h-32 w-32 items-center justify-center rounded-full ${theme.iconBg} shadow-2xl`}
                    style={{ boxShadow: `0 0 60px ${theme.glow}80` }}
                >
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 12 }}
                    >
                        <Icon className="h-16 w-16 text-black" strokeWidth={3} />
                    </motion.div>
                </motion.div>
            </div>

            <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-1 font-bebas text-6xl uppercase tracking-wide"
            >
                {theme.title}
            </motion.h1>

            <motion.h2
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`mb-1 text-2xl font-bold ${theme.text}`}
            >
                {details?.name}
            </motion.h2>

            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mb-6 text-sm text-zinc-400"
            >
                {theme.sub}
            </motion.p>

            <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900/60 px-10 py-4 backdrop-blur-sm"
            >
                <p className="mb-1 text-xs uppercase tracking-widest text-zinc-500">
                    {theme.timeLabel}
                </p>
                <p className="font-mono text-3xl text-white">
                    {details?.time || new Date().toLocaleTimeString()}
                </p>
            </motion.div>

            {isCheckIn && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                    className="mb-6 flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 ring-1 ring-green-500/30"
                >
                    <PartyPopper className="h-4 w-4" /> Attendance marked
                </motion.div>
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

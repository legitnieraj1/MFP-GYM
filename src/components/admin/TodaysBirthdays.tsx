"use client";

import { useEffect, useRef, useState } from "react";
import { Cake } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodaysBirthdays } from "@/app/actions/admin";
import { openWhatsAppBirthdayWish } from "@/utils/whatsapp";

type BirthdayMember = {
    id: string;
    name: string;
    phone: string;
    photo: string | null;
    age: number;
    dob: string;
};

// Confetti particle – purely CSS, zero deps
function ConfettiPop({ active }: { active: boolean }) {
    if (!active) return null;
    const particles = Array.from({ length: 18 });
    const colors = ["#22c55e", "#facc15", "#f97316", "#a855f7", "#38bdf8", "#ec4899"];
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            {particles.map((_, i) => {
                const color = colors[i % colors.length];
                const left = Math.random() * 100;
                const delay = Math.random() * 0.6;
                const size = 5 + Math.random() * 5;
                return (
                    <div
                        key={i}
                        className="absolute top-0 confetti-fall"
                        style={{
                            left: `${left}%`,
                            width: size,
                            height: size,
                            background: color,
                            borderRadius: Math.random() > 0.5 ? "50%" : "0%",
                            animationDelay: `${delay}s`,
                        }}
                    />
                );
            })}
        </div>
    );
}

function BirthdayCard({ member }: { member: BirthdayMember }) {
    const [wished, setWished] = useState(false);
    const [confetti, setConfetti] = useState(false);
    const initial = member.name.charAt(0).toUpperCase();

    const handleWish = () => {
        openWhatsAppBirthdayWish({ name: member.name, phone: member.phone });
        setWished(true);
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2200);
    };

    // Pastel-gradient avatar colors derived from name initial
    const avatarColors: Record<string, string> = {
        A: "#7C3AED", B: "#2563EB", C: "#059669", D: "#DC2626",
        E: "#D97706", F: "#7C3AED", G: "#0891B2", H: "#BE185D",
        I: "#4F46E5", J: "#16A34A", K: "#CA8A04", L: "#B45309",
        M: "#9333EA", N: "#0284C7", O: "#EA580C", P: "#4338CA",
        Q: "#15803D", R: "#B91C1C", S: "#0D9488", T: "#7C2D12",
        U: "#6D28D9", V: "#1D4ED8", W: "#065F46", X: "#92400E",
        Y: "#831843", Z: "#1E3A5F",
    };
    const avatarBg = avatarColors[initial] || "#4F46E5";

    return (
        <div className="relative group flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all duration-300 hover:bg-yellow-500/5 overflow-hidden">
            {/* Subtle birthday glow */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: "inset 0 0 30px rgba(234,179,8,0.07)" }}
            />
            <ConfettiPop active={confetti} />

            <div className="flex items-center gap-3 z-10">
                {/* Avatar */}
                <div className="relative">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0"
                        style={{ background: `linear-gradient(135deg, ${avatarBg}CC, ${avatarBg}88)` }}
                    >
                        {initial}
                    </div>
                    {/* Birthday badge */}
                    <span className="absolute -bottom-1 -right-1 text-[10px] leading-none">🎂</span>
                </div>

                <div>
                    <div className="text-sm font-semibold text-white">{member.name}</div>
                    <div className="text-xs text-yellow-400/80 font-medium">
                        Birthday Today · Turning {member.age} 🎉
                    </div>
                </div>
            </div>

            {/* Wish Button */}
            <button
                onClick={handleWish}
                disabled={!member.phone}
                title={!member.phone ? "No phone number" : `Wish ${member.name} on WhatsApp`}
                className={`z-10 relative flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all duration-200
                    ${wished
                        ? "bg-green-500/30 text-green-300 border-green-500/40 cursor-default"
                        : "bg-green-600/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border-green-600/20 hover:border-green-500/40 active:scale-95"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
                {wished ? "Wished ✓" : "Wish 💬"}
            </button>
        </div>
    );
}

export default function TodaysBirthdays() {
    const [members, setMembers] = useState<BirthdayMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getTodaysBirthdays().then((res) => {
            if (res.success && res.data) {
                setMembers(res.data as BirthdayMember[]);
            }
            setLoading(false);
        });
    }, []);

    return (
        <Card className="col-span-3 bg-zinc-900 border-zinc-800 relative overflow-hidden">
            {/* Subtle ambient glow in the card header area */}
            <div className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(234,179,8,0.08) 0%, transparent 70%)" }}
            />

            <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                    <Cake className="h-4 w-4 text-yellow-400" />
                    Today&apos;s Birthdays
                    {members.length > 0 && (
                        <span className="ml-auto text-xs font-normal bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                            {members.length} today
                        </span>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-14 rounded-xl bg-zinc-800/60 animate-pulse" />
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                        <span className="text-3xl">🎉</span>
                        <p className="text-zinc-500 text-sm">No birthdays today</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {members.map((member) => (
                            <BirthdayCard key={member.id} member={member} />
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Confetti keyframes via inline style */}
            <style>{`
                @keyframes confetti-drop {
                    0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(140px) rotate(360deg); opacity: 0; }
                }
                .confetti-fall {
                    animation: confetti-drop 1.8s ease-in forwards;
                }
            `}</style>
        </Card>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Lock, Mail, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError("Invalid admin credentials");
                return;
            }

            // Check if user is actually an admin
            if (data.user) {
                const { data: userData, error: userError } = await supabase
                    .from("users")
                    .select("role")
                    .eq("id", data.user.id)
                    .single();

                if (userError || (userData?.role !== "ADMIN" && userData?.role !== "DALUXEADMIN")) {
                    console.error("Login verification failed:", userError, userData);
                    await supabase.auth.signOut();
                    setError(`Access denied. Role: ${userData?.role || 'None'}`);
                    return;
                }

                router.push("/admin/dashboard");
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[url('/auth-bg.webp')] opacity-10 bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/90 to-[#0A0A0A]/80" />

            {/* Red Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E50914] rounded-full blur-[120px] opacity-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md p-8"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-4 bg-[#E50914]/10 rounded-full mb-4 border border-[#E50914]/20">
                        <Dumbbell className="w-10 h-10 text-[#E50914]" />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-wider mb-2">
                        MFP <span className="text-[#E50914]">ADMIN</span>
                    </h1>
                    <p className="text-zinc-400">Restricted Access Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl">
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-500 text-sm">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-300">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <Input
                                type="email"
                                placeholder="admin@mfpgym.com"
                                className="pl-10 bg-black/50 border-white/10 text-white focus:border-[#E50914] focus:ring-[#E50914]/20 h-12"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-zinc-300">Password</label>
                            <a href="#" className="text-xs text-[#E50914] hover:underline">Forgot password?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                className="pl-10 bg-black/50 border-white/10 text-white focus:border-[#E50914] focus:ring-[#E50914]/20 h-12"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold tracking-wide shadow-[0_0_20px_-5px_#E50914]"
                    >
                        {loading ? "AUTHENTICATING..." : "ACCESS DASHBOARD"}
                    </Button>
                </form>

                <p className="text-center mt-8 text-zinc-500 text-xs">
                    Protected by reCAPTCHA and Subject to the MFP Privacy Policy.
                </p>
            </motion.div>
        </div>
    );
}

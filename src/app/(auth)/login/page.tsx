"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setError(error.message);
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent pointer-events-none" />

            <Card className="w-full max-w-md bg-zinc-900/80 border-zinc-800 backdrop-blur-md relative z-10 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-4xl font-heading text-white tracking-wide">WELCOME <span className="text-[#E50914]">BACK</span></CardTitle>
                    <CardDescription className="text-zinc-400">Enter your credentials to access your dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-black/50 border-zinc-700 text-white focus:border-[#E50914] h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-black/50 border-zinc-700 text-white focus:border-[#E50914] h-12"
                            />
                        </div>

                        {error && <p className="text-[#E50914] text-sm text-center font-medium bg-[#E50914]/10 p-2 rounded">{error}</p>}

                        <Button type="submit" className="w-full font-bold h-12 text-base bg-[#E50914] hover:bg-[#E50914]/90 text-white shadow-[0_0_15px_-5px_#E50914] transition-all" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "LOGIN"}
                        </Button>

                        <div className="text-center text-sm text-zinc-500 mt-4">
                            Don't have an account? <Link href="/register" className="text-white hover:text-[#E50914] transition-colors font-medium">Join now</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

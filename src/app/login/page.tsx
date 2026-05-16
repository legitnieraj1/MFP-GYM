"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Smartphone, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refresh } = useAuth();
    // Where to go after a successful login (e.g. /attendance/tap from NFC redirect)
    const redirectTo = searchParams.get("redirect") || "/dashboard";

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({ mobile: "", pin: "" });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            await refresh();

            // Refresh server state then navigate to the original destination
            router.refresh();
            router.push(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl shadow-red-900/10">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                            Welcome Back
                        </CardTitle>
                        <CardDescription className="text-center text-zinc-400">
                            {redirectTo !== "/dashboard"
                                ? "Login to continue to your session"
                                : "Enter your mobile number and PIN to access your dashboard"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-900/50 border border-red-900 text-red-200 text-sm p-3 rounded-md text-center">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-zinc-200">
                                    Mobile Number
                                </Label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="mobile"
                                        name="mobile"
                                        placeholder="Enter your number"
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={handleChange}
                                        required
                                        className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-red-600 focus:border-red-600"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-zinc-200">
                                    PIN
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <Input
                                        id="pin"
                                        name="pin"
                                        placeholder="Enter your PIN"
                                        type="password"
                                        value={formData.pin}
                                        onChange={handleChange}
                                        required
                                        className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-red-600 focus:border-red-600 tracking-widest"
                                    />
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        Login to Dashboard{" "}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 text-center">
                        <div className="text-sm text-zinc-400">
                            Don&apos;t have an account?{" "}
                            <Link
                                href="/signup"
                                className="text-red-500 hover:text-red-400 font-semibold hover:underline"
                            >
                                Join Now
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}

// useSearchParams requires a Suspense boundary in Next.js App Router
export default function LoginPage() {
    return (
        <Suspense>
            <LoginForm />
        </Suspense>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Smartphone, Lock, User, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function SignupPage() {
    const router = useRouter();
    const { refresh } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        age: "",
        mobile: "",
        pin: "",
        confirmPin: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (formData.pin !== formData.confirmPin) {
            setError("PINs do not match");
            setIsLoading(false);
            return;
        }

        if (formData.pin.length !== 4) {
            setError("PIN must be exactly 4 digits");
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    age: formData.age || undefined,
                    dob: (formData as any).dob || undefined,
                    mobile: formData.mobile,
                    pin: formData.pin
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Signup failed");
            }

            await refresh();

            // Force refresh to update server components
            router.refresh();
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg"
            >
                <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl shadow-red-900/10">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-3xl font-bold tracking-tight text-center bg-gradient-to-r from-red-500 to-red-800 bg-clip-text text-transparent">
                            Join MFP GYM
                        </CardTitle>
                        <CardDescription className="text-center text-zinc-400">
                            Start your fitness journey today. Create your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-900/50 border border-red-900 text-red-200 text-sm p-3 rounded-md text-center">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="name" className="text-zinc-200">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="name"
                                            name="name"
                                            placeholder="Enter your name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-red-600 focus:border-red-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="age" className="text-zinc-200">Age (Optional)</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="age"
                                            name="age"
                                            placeholder="Enter your age"
                                            type="number"
                                            min="5"
                                            max="99"
                                            value={formData.age}
                                            onChange={handleChange}
                                            className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-red-600 focus:border-red-600"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2 md:col-span-1">
                                    <Label htmlFor="dob" className="text-zinc-200">Date of Birth</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="dob"
                                            name="dob"
                                            type="date"
                                            value={(formData as any).dob || ""}
                                            onChange={handleChange}
                                            className="pl-10 bg-zinc-950 border-zinc-800 text-white focus:ring-red-600 focus:border-red-600"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="mobile" className="text-zinc-200">Mobile Number</Label>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="pin" className="text-zinc-200">Create PIN</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="pin"
                                            name="pin"
                                            placeholder="Enter your PIN"
                                            type="password"
                                            maxLength={4}
                                            value={formData.pin}
                                            onChange={handleChange}
                                            required
                                            className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-red-600 focus:border-red-600 tracking-widest"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="confirmPin" className="text-zinc-200">Confirm PIN</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="confirmPin"
                                            name="confirmPin"
                                            placeholder="Confirm your PIN"
                                            type="password"
                                            maxLength={4}
                                            value={formData.confirmPin}
                                            onChange={handleChange}
                                            required
                                            className="pl-10 bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:ring-red-600 focus:border-red-600 tracking-widest"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 mt-4"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        Create Account <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 text-center">
                        <div className="text-sm text-zinc-400">
                            Already a member?{" "}
                            <Link href="/login" className="text-red-500 hover:text-red-400 font-semibold hover:underline">
                                Login Here
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}

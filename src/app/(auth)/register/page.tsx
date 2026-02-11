"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    phone: z.string().min(10, "Phone number is required"),
    age: z.coerce.number().min(10, "Age must be valid"),
    weight: z.coerce.number().min(20, "Weight must be valid"),
    height: z.coerce.number().min(50, "Height must be valid (cm)"),
    address: z.string().optional(),
    bodyGoal: z.string().optional(),
});

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { register, handleSubmit, formState: { errors } } = useForm<any>({
        resolver: zodResolver(formSchema),
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (res.ok) {
                router.push("/login?registered=true");
            } else {
                const data = await res.json();
                alert(data.message || "Registration failed");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            {/* Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2575&auto=format&fit=crop')] bg-cover bg-center opacity-20 pointer-events-none" />

            <Card className="w-full max-w-2xl bg-zinc-900/90 border-zinc-800 backdrop-blur-sm relative z-10">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-3xl font-heading text-white">JOIN THE <span className="text-primary">ELITE</span></CardTitle>
                    <CardDescription>Enter your details to start your journey.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input placeholder="Full Name" {...register("name")} className="bg-black/50" />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Input type="email" placeholder="Email" {...register("email")} className="bg-black/50" />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email.message as string}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Input type="password" placeholder="Password" {...register("password")} className="bg-black/50" />
                                {errors.password && <p className="text-red-500 text-xs">{errors.password.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Input placeholder="Phone" {...register("phone")} className="bg-black/50" />
                                {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message as string}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Input type="number" placeholder="Age" {...register("age")} className="bg-black/50" />
                                {errors.age && <p className="text-red-500 text-xs">{errors.age.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Input type="number" placeholder="Weight (kg)" {...register("weight")} className="bg-black/50" />
                                {errors.weight && <p className="text-red-500 text-xs">{errors.weight.message as string}</p>}
                            </div>
                            <div className="space-y-2">
                                <Input type="number" placeholder="Height (cm)" {...register("height")} className="bg-black/50" />
                                {errors.height && <p className="text-red-500 text-xs">{errors.height.message as string}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <select
                                {...register("bodyGoal")}
                                className="flex h-10 w-full rounded-md border border-input bg-black/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-white"
                            >
                                <option value="MAINTAIN">Maintenance</option>
                                <option value="CUT">Weight Loss (Cut)</option>
                                <option value="BULK">Muscle Gain (Bulk)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Textarea placeholder="Address" {...register("address")} className="bg-black/50" />
                        </div>

                        <Button type="submit" className="w-full font-bold" variant="premium" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            CREATE ACCOUNT
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            Already a member? <Link href="/login" className="text-primary hover:underline">Login here</Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

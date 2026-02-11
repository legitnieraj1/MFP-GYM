"use client";

import { motion } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const plans = [
    {
        name: "BASIC",
        price: "₹3,000",
        period: "/ quarter",
        description: "Pay 3 months, get 3 months free. Perfect for starters.",
        features: [
            "Access to Gym Floor",
            "Locker Access",
            "General Trainer Support",
            "Steam  Bath (1x/week)",
        ],
        notIncluded: ["Personal Training", "Diet Plan", "Massage"],
        featured: false,
    },
    {
        name: "PRO",
        price: "₹4,500",
        period: "/ half-year",
        description: "Pay 6 months, get 6 months free. Serious gains.",
        features: [
            "All Basic Benefits",
            "Personal Diet Plan",
            "Steam Bath (Unlimited)",
            "CrossFit Access",
        ],
        notIncluded: ["Massage Therapy"],
        featured: true,
    },
    {
        name: "ELITE",
        price: "₹6,500",
        period: "/ year",
        description: "Pay 1 year, get 1 year free. Total transformation.",
        features: [
            "All Pro Benefits",
            "Dedicated Personal Trainer",
            "Weekly Massage Therapy",
            "Nutrition & Supplement Guide",
            "Guest Pass (2/month)",
        ],
        notIncluded: [],
        featured: false,
    },
];

export function Membership() {
    const router = useRouter();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (plan: string) => {
        try {
            setLoadingPlan(plan);

            // 1. Check Auth
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Not logged in -> Redirect to register
                router.push("/register");
                return;
            }

            // 2. Create Order
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to create order");
            }

            // 3. Open Razorpay
            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "MFP GYM",
                description: `${plan} Membership`,
                order_id: data.orderId,
                handler: async function (response: any) {
                    // Verify Payment
                    try {
                        const verifyRes = await fetch("/api/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                plan: plan
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyRes.ok) {
                            router.push("/dashboard"); // Success
                        } else {
                            alert("Payment verification failed: " + verifyData.message);
                        }
                    } catch (err) {
                        alert("Payment verification error");
                    }
                },
                prefill: {
                    name: user.user_metadata?.name || "",
                    email: user.email,
                    contact: user.phone || ""
                },
                theme: {
                    color: "#E50914"
                }
            };

            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();

        } catch (error: any) {
            alert(error.message);
            if (error.message === "Unauthorized") {
                router.push("/login");
            }
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <section className="py-24 bg-black relative overflow-hidden" id="plans">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-heading font-bold text-white mb-4"
                    >
                        CHOOSE YOUR <span className="text-primary">WARPATH</span>
                    </motion.h2>
                    <p className="text-muted-foreground">
                        Invest in yourself. No hidden fees. No compromises.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.03 }}
                            className="relative"
                        >
                            {plan.featured && (
                                <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg shadow-primary/50">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <Card className={`h-full flex flex-col relative border-white/10 overflow-hidden ${plan.featured ? 'bg-zinc-900 ring-2 ring-primary ring-offset-2 ring-offset-black' : 'bg-black'}`}>
                                <CardHeader>
                                    <CardTitle className="text-2xl font-bold font-heading tracking-wider">{plan.name}</CardTitle>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                                        <span className="ml-2 text-sm text-muted-foreground">{plan.period}</span>
                                    </div>
                                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <ul className="space-y-3">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-start">
                                                <Check className="w-5 h-5 text-primary mr-2 shrink-0" />
                                                <span className="text-sm text-gray-300">{feature}</span>
                                            </li>
                                        ))}
                                        {plan.notIncluded.map((feature, i) => (
                                            <li key={i} className="flex items-start opacity-50">
                                                <X className="w-5 h-5 text-gray-600 mr-2 shrink-0" />
                                                <span className="text-sm text-gray-500">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        variant={plan.featured ? "premium" : "outline"}
                                        className="w-full h-12 text-lg font-bold uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-transparent"
                                        onClick={() => handleSubscribe(plan.name)}
                                        disabled={loadingPlan === plan.name}
                                    >
                                        {loadingPlan === plan.name ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            `Choose ${plan.name}`
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

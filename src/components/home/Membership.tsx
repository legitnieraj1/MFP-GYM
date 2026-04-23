"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Dumbbell, Target, Crown, Trophy, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

const membershipPlans = [
    {
        name: "1 MONTH",
        price: "₹1,530",
        period: "Monthly",
        description: "Flexible, no commitment",
        bonus: null,
        featured: false,
    },
    {
        name: "3 MONTHS",
        price: "₹4,080",
        period: "Quarterly",
        description: "Pay 3 months, get 3 free",
        bonus: "+3 MONTHS FREE",
        featured: false,
    },
    {
        name: "6 MONTHS",
        price: "₹5,610",
        period: "Semi-Annual",
        description: "Pay 6 months, get 6 free",
        bonus: "+6 MONTHS FREE",
        featured: false,
    },
    {
        name: "1 YEAR",
        price: "₹8,160",
        period: "Annual",
        description: "Pay 1 year, get 1 year free",
        bonus: "+1 YEAR FREE",
        featured: true,
    },
    {
        name: "2 YEARS",
        price: "₹12,750",
        period: "Bi-Annual",
        description: "Pay 2 years, get 2 years free",
        bonus: "+2 YEARS FREE",
        featured: false,
    },
];

const gymInclusions = [
    "Access to Gym Floor",
    "Locker Access",
    "Trainer Support",
    "Steam Bath",
];

const programs = [
    {
        icon: Dumbbell,
        name: "Personal Training",
        duration: "30 Days",
        price: "₹6,000",
        tag: null,
        tagStyle: "",
        description: "One-on-one coaching tailored to your body and goals with a dedicated trainer.",
        features: [
            "Dedicated personal trainer",
            "Customized workout plan",
            "Strength & stretching sessions",
            "Weekly progress tracking",
        ],
        whatsapp: "Hi! I'm interested in the Personal Training program (₹6,000 / 30 Days). Please share more details.",
        cta: "Enquire on WhatsApp",
    },
    {
        icon: Target,
        name: "60-Day Transformation",
        duration: "60 Days",
        price: "₹10,000",
        tag: "Most Chosen",
        tagStyle: "bg-primary text-white",
        description: "8-week structured program built for maximum fat loss and body recomposition.",
        features: [
            "8-week structured plan",
            "Fat loss & body recomposition",
            "Daily diet follow-up via WhatsApp",
            "Weekend weight check-ins",
        ],
        whatsapp: "Hi! I'm ready to start my 60-Day Transformation (₹10,000). Let's go!",
        cta: "Start Transformation",
    },
    {
        icon: Crown,
        name: "120-Day Transformation",
        duration: "120 Days",
        price: "₹15,000",
        tag: "Elite",
        tagStyle: "bg-amber-500 text-black",
        description: "16-week complete lifestyle overhaul with elite coaching and premium support.",
        features: [
            "Dedicated personal trainer",
            "Customized diet & workout plan",
            "WhatsApp diet follow-ups",
            "Optional professional photoshoot",
        ],
        whatsapp: "Hi! I want to apply for the 120-Day Elite Transformation (₹15,000).",
        cta: "Apply Now",
    },
    {
        icon: Trophy,
        name: "Contest Preparation",
        duration: "90 Days",
        price: "₹10,000",
        tag: null,
        tagStyle: "",
        description: "Competition-focused conditioning designed to get you stage-ready.",
        features: [
            "Stage-ready conditioning",
            "Peak week protocols",
            "Posing & presentation guidance",
            "Supplement strategy",
        ],
        whatsapp: "Hi! I'm interested in the Contest Preparation program (₹10,000 / 90 Days). Please share details.",
        cta: "Enquire on WhatsApp",
    },
    {
        icon: Heart,
        name: "Post Partum Weight Loss",
        duration: "30 Days",
        price: "₹5,000",
        tag: null,
        tagStyle: "",
        description: "Safe and effective post-delivery weight management with expert guidance.",
        features: [
            "Safe post-delivery training",
            "Core restoration focus",
            "Nutritional guidance",
            "Weekly progress monitoring",
        ],
        whatsapp: "Hi! I'm interested in the Post Partum Weight Loss program (₹5,000 / 30 Days).",
        cta: "Enquire on WhatsApp",
    },
];

export function Membership({ user }: { user?: any }) {
    const router = useRouter();
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleWhatsApp = (message: string) => {
        const phone = "918098834154";
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    };

    const handleSubscribe = async (plan: string) => {
        try {
            setLoadingPlan(plan);
            if (!user) {
                router.push("/login");
                return;
            }
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create order");
            const options = {
                key: data.key,
                amount: data.amount,
                currency: data.currency,
                name: "MFP GYM",
                description: `${plan} Membership`,
                order_id: data.orderId,
                handler: async function (response: any) {
                    try {
                        const verifyRes = await fetch("/api/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                orderId: response.razorpay_order_id,
                                paymentId: response.razorpay_payment_id,
                                signature: response.razorpay_signature,
                                plan,
                            }),
                        });
                        const verifyData = await verifyRes.json();
                        if (verifyRes.ok) {
                            router.push("/dashboard");
                        } else {
                            alert("Payment verification failed: " + verifyData.message);
                        }
                    } catch {
                        alert("Payment verification error");
                    }
                },
                prefill: {
                    name: user.name || "",
                    contact: user.mobile || user.phone || "",
                },
                theme: { color: "#E50914" },
            };
            const rzp1 = new (window as any).Razorpay(options);
            rzp1.open();
        } catch (error: any) {
            alert(error.message);
            if (error.message === "Unauthorized") router.push("/login");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <section className="py-14 md:py-24 bg-black relative overflow-hidden" id="plans">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">

                {/* ── SECTION HEADER ── */}
                <div className="text-center mb-14">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 border border-primary/30 bg-primary/8 text-primary text-[11px] font-bold px-5 py-2 rounded-full mb-5 uppercase tracking-[0.2em]"
                    >
                        ✦ No Admission Fee
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 }}
                        className="text-4xl md:text-5xl font-heading font-bold text-white mb-4"
                    >
                        AFFORDABLE GYM{" "}
                        <span className="text-primary">MEMBERSHIP PLANS</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-muted-foreground max-w-lg mx-auto"
                    >
                        Best gym rates in Periyanaickenpalayam. Invest in yourself — no hidden fees, no compromises.
                    </motion.p>
                </div>

                {/* ── MEMBERSHIP PLAN CARDS ── */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4 max-w-7xl mx-auto">
                    {membershipPlans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.07 }}
                            className="relative group h-full"
                        >
                            {plan.featured && (
                                <div className="absolute -top-3.5 inset-x-0 flex justify-center z-20">
                                    <span className="bg-primary text-white text-[9px] md:text-[10px] font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full uppercase tracking-[0.15em] shadow-[0_0_20px_rgba(229,9,20,0.6)]">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className={`relative h-full p-[1.5px] rounded-2xl overflow-hidden transition-all duration-500 ${plan.featured ? "shadow-[0_0_40px_rgba(229,9,20,0.2)]" : ""}`}>
                                {/* Saber spin border */}
                                <div className="absolute inset-[-100%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_20%,#E50914_50%,transparent_80%,transparent_100%)] pointer-events-none" />

                                <Card className={`relative z-10 h-full rounded-[14px] border-0 flex flex-col ${plan.featured ? "bg-[#110000] ring-1 ring-primary/40" : "bg-[#0c0c0c]"}`}>
                                    <CardHeader className={`${plan.featured ? "pt-8 md:pt-10" : "pt-5 md:pt-7"} pb-2 px-3 md:px-5 text-center`}>
                                        <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1.5 md:mb-3">
                                            {plan.period}
                                        </p>
                                        <CardTitle className="text-[11px] md:text-base font-extrabold font-heading tracking-widest text-zinc-100 mb-2 md:mb-4">
                                            {plan.name}
                                        </CardTitle>
                                        <div className="mb-2 md:mb-3">
                                            <span className={`font-black text-white tabular-nums ${plan.featured ? "text-[1.5rem] md:text-[2.2rem]" : "text-[1.3rem] md:text-[1.9rem]"}`}>
                                                {plan.price}
                                            </span>
                                        </div>
                                        {plan.bonus ? (
                                            <span className="inline-block bg-primary/15 border border-primary/35 text-primary text-[8px] md:text-[10px] font-bold px-2 md:px-2.5 py-0.5 md:py-1 rounded-full uppercase tracking-wider">
                                                {plan.bonus}
                                            </span>
                                        ) : (
                                            <span className="inline-block text-[10px] opacity-0 select-none">–</span>
                                        )}
                                    </CardHeader>

                                    <CardContent className="flex-1 px-3 md:px-5 pb-2 md:pb-3 hidden md:flex items-center justify-center">
                                        <p className="text-xs text-zinc-500 text-center leading-relaxed">
                                            {plan.description}
                                        </p>
                                    </CardContent>

                                    <CardFooter className="pb-4 md:pb-6 px-3 md:px-5">
                                        <Button
                                            variant={plan.featured ? "premium" : "outline"}
                                            size="sm"
                                            className="w-full h-8 md:h-10 text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 group-hover:border-primary group-hover:text-primary"
                                            onClick={() => handleSubscribe(plan.name)}
                                            disabled={loadingPlan === plan.name}
                                        >
                                            {loadingPlan === plan.name ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                "Choose"
                                            )}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* All plans include */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-8 max-w-2xl mx-auto text-center"
                >
                    <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] mb-3">All plans include</p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {gymInclusions.map((item, i) => (
                            <span
                                key={i}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 bg-white/4 border border-white/8 px-3 py-1.5 rounded-full"
                            >
                                <Check className="w-3 h-3 text-primary shrink-0" />
                                {item}
                            </span>
                        ))}
                    </div>
                </motion.div>

                {/* ── DIVIDER ── */}
                <div className="my-12 md:my-24 flex items-center gap-4 max-w-5xl mx-auto">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                    <div className="flex gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary/40" />
                        <span className="w-1 h-1 rounded-full bg-primary/70" />
                        <span className="w-1 h-1 rounded-full bg-primary/40" />
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                </div>

                {/* ── COACHING PROGRAMS ── */}
                <div className="text-center mb-14">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 uppercase"
                    >
                        COACHING &{" "}
                        <span className="text-primary">SPECIALTY PROGRAMS</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.08 }}
                        className="text-muted-foreground max-w-lg mx-auto"
                    >
                        Result-driven programs designed for serious transformations and specific goals.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
                    {programs.map((program, index) => {
                        const Icon = program.icon;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: (index % 3) * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className={`relative ${index === 3 ? "sm:col-start-1 lg:col-start-1" : ""} ${index === 4 ? "sm:col-span-2 lg:col-span-1 lg:col-start-2" : ""}`}
                            >
                                {program.tag && (
                                    <div className="absolute -top-3.5 inset-x-0 flex justify-center z-10">
                                        <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg ${program.tagStyle}`}>
                                            {program.tag}
                                        </span>
                                    </div>
                                )}
                                <Card className={`h-full flex flex-col bg-[#0a0a0a] border-white/8 hover:border-primary/30 transition-all duration-300 ${program.tag === "Most Chosen" ? "ring-1 ring-primary/25 pt-2" : ""}`}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                <Icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <span className="text-xs text-zinc-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full font-medium">
                                                {program.duration}
                                            </span>
                                        </div>
                                        <CardTitle className="text-xl font-bold font-heading tracking-wide text-white mb-2">
                                            {program.name}
                                        </CardTitle>
                                        <span className="text-3xl font-black text-white tabular-nums">
                                            {program.price}
                                        </span>
                                    </CardHeader>
                                    <CardContent className="flex-1 pb-4">
                                        <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                                            {program.description}
                                        </p>
                                        <ul className="space-y-2.5">
                                            {program.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter className="pt-0 pb-6 px-6">
                                        <Button
                                            variant={program.tag === "Most Chosen" ? "premium" : "outline"}
                                            className="w-full h-11 font-bold uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-transparent transition-all duration-300"
                                            onClick={() => handleWhatsApp(program.whatsapp)}
                                        >
                                            {program.cta}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}

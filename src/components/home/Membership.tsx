"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Dumbbell, Target, Crown, Trophy, Heart, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/* ── Plan data ── */
const membershipPlans = [
    {
        name: "1 MONTH",
        price: 1530,
        period: "Monthly",
        description: "Flexible, no commitment",
        bonus: null,
        featured: false,
        perMonth: "₹1,530/mo",
    },
    {
        name: "3 MONTHS",
        price: 4080,
        period: "Quarterly",
        description: "Pay 3, get 3 free",
        bonus: "+3 months free",
        featured: false,
        perMonth: "₹680/mo",
    },
    {
        name: "6 MONTHS",
        price: 5610,
        period: "Semi-Annual",
        description: "Pay 6, get 6 free",
        bonus: "+6 months free",
        featured: false,
        perMonth: "₹468/mo",
    },
    {
        name: "1 YEAR",
        price: 8160,
        period: "Annual",
        description: "Pay 1 year, get 1 year free",
        bonus: "+1 year free",
        featured: true,
        perMonth: "₹340/mo",
    },
    {
        name: "2 YEARS",
        price: 12750,
        period: "Bi-Annual",
        description: "Pay 2 years, get 2 years free",
        bonus: "+2 years free",
        featured: false,
        perMonth: "₹265/mo",
    },
];

const gymInclusions = [
    "Gym Floor Access",
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
        description: "One-on-one coaching tailored to your body and goals.",
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
        tag: "Popular",
        description: "8-week structured program for fat loss and body recomposition.",
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
        description: "16-week complete lifestyle overhaul with premium coaching.",
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
        description: "Competition-focused conditioning to get you stage-ready.",
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
        description: "Safe and effective post-delivery weight management.",
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
        <section className="py-16 md:py-28 bg-black relative overflow-hidden" id="plans">
            <div className="container mx-auto px-4 relative z-10">

                {/* ── SECTION HEADER ── */}
                <div className="text-center mb-12 md:mb-16">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 mb-4 block">
                        No admission fee
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] md:leading-[1.1] font-heading font-bold text-white mb-3">
                        PICK YOUR PLAN
                    </h2>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        No hidden charges. Every plan includes gym floor, lockers, trainer support &amp; steam bath.
                    </p>
                </div>

                {/* ── PRICING CARDS — 21st-style layout ── */}
                {/* Desktop: 5 cards in row, featured scaled up. Mobile: stacked */}
                <div className="flex flex-col items-center gap-4 md:flex-row md:justify-center md:items-end md:gap-3 lg:gap-4 mb-8">
                    {membershipPlans.map((plan, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", duration: 0.5, delay: index * 0.06 }}
                            className={`relative w-full transition-transform ${
                                plan.featured
                                    ? "md:w-72 lg:w-80 z-20 md:scale-105"
                                    : "md:w-56 lg:w-64 z-10"
                            }`}
                        >
                            {/* Featured card — gradient bg like Pro card */}
                            {plan.featured ? (
                                <div className="relative rounded-2xl border-2 border-red-500/40 bg-gradient-to-b from-[#E50914] to-[#8b0000] p-8 md:p-10 text-white shadow-xl shadow-red-900/20 transition-transform hover:scale-[1.02]">
                                    {/* Badge */}
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                        <span className="bg-white text-[#E50914] text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md whitespace-nowrap">
                                            Best Value
                                        </span>
                                    </div>

                                    <div className="text-center">
                                        <div className="text-sm font-semibold text-white/80 mb-1">{plan.period}</div>
                                        <div className="text-5xl font-extrabold mb-1 tabular-nums">
                                            ₹{plan.price.toLocaleString("en-IN")}
                                        </div>
                                        <div className="text-xs text-white/60 mb-4">{plan.name}</div>

                                        {plan.bonus && (
                                            <span className="inline-block bg-white/20 backdrop-blur-sm border border-white/30 text-white text-[11px] font-bold px-3 py-1 rounded-full mb-5">
                                                {plan.bonus}
                                            </span>
                                        )}

                                        <ul className="space-y-2 text-sm text-left text-white/80 mb-6 max-w-[200px] mx-auto">
                                            {gymInclusions.map((item, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    <Check className="w-3.5 h-3.5 text-white shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>

                                        <button
                                            onClick={() => handleSubscribe(plan.name)}
                                            disabled={loadingPlan === plan.name}
                                            className="w-full rounded-lg bg-neutral-900 hover:bg-neutral-800 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                                        >
                                            {loadingPlan === plan.name ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : (
                                                "Choose Plan"
                                            )}
                                        </button>
                                        <div className="text-[10px] text-white/50 mt-2">{plan.perMonth} effective</div>
                                    </div>
                                </div>
                            ) : (
                                /* Non-featured cards — dark glassmorphic */
                                <div className="relative rounded-2xl border border-red-500/[0.15] bg-black/60 backdrop-blur-md p-6 md:p-7 text-white shadow-[0_0_0_1px_rgba(229,9,20,.06)_inset] transition-transform hover:scale-[1.03]">
                                    <div className="text-center">
                                        <div className="text-sm font-semibold text-red-400/80 mb-1">{plan.period}</div>
                                        <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 tabular-nums">
                                            ₹{plan.price.toLocaleString("en-IN")}
                                        </div>
                                        <div className="text-xs text-zinc-500 mb-4">{plan.name}</div>

                                        {plan.bonus && (
                                            <span className="inline-block text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full mb-4">
                                                {plan.bonus}
                                            </span>
                                        )}
                                        {!plan.bonus && (
                                            <p className="text-[11px] text-zinc-600 mb-4">{plan.description}</p>
                                        )}

                                        <button
                                            onClick={() => handleSubscribe(plan.name)}
                                            disabled={loadingPlan === plan.name}
                                            className="w-full rounded-lg bg-[#E50914] hover:bg-[#c4070f] py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors"
                                        >
                                            {loadingPlan === plan.name ? (
                                                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                            ) : (
                                                "Choose"
                                            )}
                                        </button>
                                        <div className="text-[10px] text-zinc-600 mt-2">{plan.perMonth} effective</div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* Inclusions — subtle inline list */}
                <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs text-zinc-600">
                    <span className="uppercase tracking-wider font-medium">All plans include</span>
                    {gymInclusions.map((item, i) => (
                        <span key={i} className="flex items-center gap-1.5 text-zinc-500">
                            <Check className="w-3 h-3 text-primary/70" />
                            {item}
                        </span>
                    ))}
                </div>

                {/* ── DIVIDER ── */}
                <div className="my-16 md:my-24 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                {/* ── COACHING PROGRAMS ── */}
                <div className="text-center mb-12 md:mb-16">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 mb-4 block">
                        Programs
                    </span>
                    <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] md:leading-[1.1] font-heading font-bold text-white mb-3">
                        COACHING &amp;{" "}
                        <span className="text-primary">TRANSFORMATIONS</span>
                    </h2>
                    <p className="text-sm text-zinc-500 max-w-md mx-auto">
                        Serious programs for serious goals. All coaching includes WhatsApp support.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-5 md:flex-row md:justify-center md:items-stretch md:flex-wrap lg:flex-nowrap lg:gap-4 max-w-6xl mx-auto">
                    {programs.map((program, index) => {
                        const Icon = program.icon;
                        const isPopular = program.tag === "Popular";
                        const isElite = program.tag === "Elite";

                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ type: "spring", duration: 0.5, delay: index * 0.07 }}
                                className={`relative w-full md:w-72 lg:w-auto lg:flex-1 transition-transform ${
                                    isPopular ? "z-20 md:scale-[1.03]" : "z-10"
                                }`}
                            >
                                <div className={`relative h-full rounded-2xl p-6 transition-transform hover:scale-[1.02] ${
                                    isPopular
                                        ? "border-2 border-red-500/40 bg-gradient-to-b from-[#E50914] to-[#8b0000] text-white shadow-xl shadow-red-900/20"
                                        : "border border-red-500/[0.12] bg-black/60 backdrop-blur-md text-white shadow-[0_0_0_1px_rgba(229,9,20,.05)_inset]"
                                }`}>
                                    {program.tag && (
                                        <div className="absolute -top-2.5 right-4 z-10">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                                                isPopular
                                                    ? "bg-white text-[#E50914] shadow-md"
                                                    : "bg-amber-500/90 text-black"
                                            }`}>
                                                {program.tag}
                                            </span>
                                        </div>
                                    )}

                                    {/* Icon + Name */}
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                                            isPopular ? "bg-white/20" : "bg-primary/10"
                                        }`}>
                                            <Icon className={`w-4 h-4 ${isPopular ? "text-white" : "text-primary"}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold leading-tight">{program.name}</h3>
                                            <span className={`text-[11px] ${isPopular ? "text-white/60" : "text-zinc-500"}`}>{program.duration}</span>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-2xl font-extrabold mb-3 tabular-nums">
                                        {program.price}
                                    </div>

                                    <p className={`text-sm mb-4 leading-relaxed ${isPopular ? "text-white/70" : "text-zinc-500"}`}>
                                        {program.description}
                                    </p>

                                    {/* Features */}
                                    <ul className="space-y-2 mb-5">
                                        {program.features.map((feature, i) => (
                                            <li key={i} className={`flex items-start gap-2 text-sm ${isPopular ? "text-white/80" : "text-zinc-400"}`}>
                                                <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isPopular ? "text-white" : "text-emerald-500"}`} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* CTA */}
                                    <button
                                        onClick={() => handleWhatsApp(program.whatsapp)}
                                        className={`w-full rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                                            isPopular
                                                ? "bg-neutral-900 hover:bg-neutral-800 text-white"
                                                : "bg-[#E50914] hover:bg-[#c4070f] text-white"
                                        }`}
                                    >
                                        {program.cta}
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

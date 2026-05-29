"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
    "/unnamed (1).webp",
    "/unnamed (2).webp",
    "/unnamed (3).webp",
    "/unnamed (4).webp",
    "/unnamed (5).webp",
];

const stats = [
    { value: "800+", label: "Active Members" },
    { value: "3+", label: "Years Running" },
    { value: "4", label: "Certified Trainers" },
];

export function About() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="py-20 md:py-32 bg-black relative" id="about">
            <div className="container mx-auto px-4 relative z-10">
                {/* Top: editorial intro */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                    {/* Text column — spans 7 */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="lg:col-span-7 flex flex-col"
                    >
                        {/* Eyebrow */}
                        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500 mb-4">
                            About the gym
                        </span>

                        <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] md:leading-[1.1] font-heading font-bold text-white mb-6">
                            WHERE DISCIPLINE{" "}
                            <span className="text-primary">MEETS RESULTS</span>
                        </h2>

                        <div className="space-y-4 mb-10">
                            <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                                MFP Gym has been Periyanaickenpalayam&apos;s go-to training ground for over three years.
                                What started as a small local gym has grown into a full-fledged fitness community —
                                athletes, bodybuilders, working professionals, all training under one roof.
                            </p>
                            <p className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-2xl">
                                We don&apos;t do gimmicks. The equipment is heavy, the trainers know their craft,
                                and the results speak for themselves. Whether you&apos;re prepping for a competition
                                or starting your first week, you&apos;ll find your people here.
                            </p>
                        </div>

                        {/* Stats row */}
                        <div className="flex gap-8 sm:gap-12 pt-8 border-t border-white/10">
                            {stats.map((stat, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: 0.15 + i * 0.1, duration: 0.5 }}
                                >
                                    <span className="block text-2xl sm:text-3xl font-heading font-bold text-white">
                                        {stat.value}
                                    </span>
                                    <span className="text-xs text-zinc-500 uppercase tracking-wider">
                                        {stat.label}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Image column — spans 5 */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="lg:col-span-5"
                    >
                        <div className="relative aspect-[4/5] w-full rounded-2xl overflow-hidden bg-zinc-900">
                            <AnimatePresence mode="popLayout">
                                <motion.div
                                    key={currentImageIndex}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ backgroundImage: `url('${images[currentImageIndex]}')` }}
                                    role="img"
                                    aria-label="MFP Gym training area"
                                />
                            </AnimatePresence>

                            {/* Subtle bottom gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </div>

                        {/* Image dots */}
                        <div className="flex justify-center gap-1.5 mt-4">
                            {images.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentImageIndex(i)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                                        i === currentImageIndex
                                            ? "bg-primary w-6"
                                            : "bg-zinc-700 hover:bg-zinc-500"
                                    }`}
                                    aria-label={`View image ${i + 1}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Bottom: What you get — horizontal strip */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-16 md:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-px bg-white/[0.06] rounded-xl overflow-hidden"
                >
                    {[
                        {
                            title: "Premium Equipment",
                            desc: "Plate-loaded machines, free weights, and functional rigs — no cheap stuff.",
                        },
                        {
                            title: "Certified Trainers",
                            desc: "Each trainer has real competition and coaching experience.",
                        },
                        {
                            title: "Personalized Plans",
                            desc: "Diet and workout plans built around your body, schedule, and goals.",
                        },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className="bg-black p-6 md:p-8 group hover:bg-white/[0.02] transition-colors duration-300"
                        >
                            <span className="text-[11px] font-bold text-primary uppercase tracking-widest mb-3 block">
                                0{i + 1}
                            </span>
                            <h3 className="text-base md:text-lg font-bold text-white mb-2">
                                {item.title}
                            </h3>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}

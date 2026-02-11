"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Target, Users } from "lucide-react";

const features = [
    {
        icon: <Dumbbell className="w-8 h-8 text-primary" />,
        title: "Premium Equipment",
        description: "State-of-the-art machinery for every muscle group.",
    },
    {
        icon: <Users className="w-8 h-8 text-primary" />,
        title: "Expert Trainers",
        description: "Certified coaches to guide your transformation.",
    },
    {
        icon: <Target className="w-8 h-8 text-primary" />,
        title: "Personalized Plans",
        description: "AI-driven diet and workout plans tailored to you.",
    },
];

const images = [
    "/unnamed (1).webp",
    "/unnamed (2).webp",
    "/unnamed (3).webp",
    "/unnamed (4).webp",
    "/unnamed (5).webp",
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
        <section className="py-24 bg-black relative" id="about">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-black to-black pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    {/* Animated Text */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-heading font-bold text-white mb-6">
                            MORE THAN JUST A <span className="text-primary">GYM</span>
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            MFP GYM is a community of athletes, bodybuilders, and fitness enthusiasts committed to discipline, growth, and excellence. Our mission is to provide you with the environment, tools, and support you need to push past your limits.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.2, duration: 0.6 }}
                                    className="p-4 border border-white/5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <div className="mb-3">{feature.icon}</div>
                                    <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Animated Image Carousel */}
                    <div className="relative h-[600px] w-full rounded-2xl overflow-hidden shadow-2xl shadow-primary/20 bg-zinc-900 group">
                        <AnimatePresence mode="popLayout">
                            <motion.div
                                key={currentImageIndex}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1 }}
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url('${images[currentImageIndex]}')` }}
                            />
                        </AnimatePresence>

                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 z-10" />
                        <div className="absolute bottom-6 left-6 right-6 z-20">
                            <p className="text-white font-heading text-3xl">BUILT FOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">GREATNESS</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

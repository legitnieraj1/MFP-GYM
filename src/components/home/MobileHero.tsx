"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function MobileHero() {
    const ref = useRef(null);
    const [showContent, setShowContent] = useState(false);

    // We only want this hook to run/be effective if the component is actually visible/mounted
    // But since hooks are unconditional, we rely on the parent to unmount this component on Desktop.
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    return (
        <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden bg-black" id="home">
            {/* Background Parallax */}
            <motion.div
                style={{ y, opacity }}
                className="absolute inset-0 z-0"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/30 z-10" />
                {/* Desktop Video (Tablet view) */}
                <video
                    autoPlay
                    muted
                    playsInline
                    className="hidden md:block w-full h-full object-cover"
                    onTimeUpdate={(e) => {
                        if (e.currentTarget.currentTime >= 8) {
                            e.currentTarget.pause();
                            setShowContent(true);
                        }
                    }}
                >
                    <source src="/intro video.mp4" type="video/mp4" />
                </video>
                {/* Mobile Video */}
                <video
                    autoPlay
                    muted
                    playsInline
                    className="block md:hidden w-full h-full object-cover"
                    onTimeUpdate={(e) => {
                        if (e.currentTarget.currentTime >= 8) {
                            e.currentTarget.pause();
                            setShowContent(true);
                        }
                    }}
                >
                    <source src="/intro video mobile.mp4" type="video/mp4" />
                </video>
            </motion.div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 50 }}
                    animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-5xl md:text-8xl font-heading font-bold text-white mb-6 tracking-tighter"
                >
                    TRAIN <span className="text-primary text-glow">HARD</span>. <br />
                    STAY <span className="text-primary text-glow">STRONG</span>.
                    <span className="sr-only">MFP Gym - Best Gym in Periyanaickenpalayam, Coimbatore</span>
                </motion.h1>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Button
                        asChild
                        className="bg-[#E50914] hover:bg-[#b2070f] text-white rounded-full h-12 px-8 text-sm font-bold tracking-[0.2em] shadow-[0_0_20px_-5px_#E50914] transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_#E50914]"
                    >
                        <Link href="/signup" className="flex items-center gap-2">
                            JOIN NOW <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="bg-transparent text-white border border-white/20 hover:border-white/60 hover:bg-white/5 rounded-full h-12 px-8 text-sm font-bold tracking-[0.2em] transition-all hover:scale-105 backdrop-blur-sm"
                    >
                        <Link href="#plans">VIEW PLANS</Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}

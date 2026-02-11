"use client";

import { useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
    const ref = useRef(null);
    const [showContent, setShowContent] = useState(false);
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
                {/* Placeholder for video/image - using a dark gym aesthetic image */}
                {/* Desktop Video */}
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
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto font-light"
                >
                    MFP GYM — Your journey to strength, discipline, and peak performance starts here.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                >
                    <Button size="lg" variant="premium" className="text-lg w-full sm:w-auto h-14 px-8">
                        <Link href="/register" className="flex items-center gap-2">
                            JOIN NOW <ArrowRight className="w-5 h-5" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="text-lg w-full sm:w-auto h-14 px-8 border-white/20 hover:bg-white/10 text-white">
                        <Link href="#plans">VIEW PLANS</Link>
                    </Button>
                </motion.div>
            </div>
        </section>
    );
}

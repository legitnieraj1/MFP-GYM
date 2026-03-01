"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function ScrollyCanvasHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [images, setImages] = useState<HTMLImageElement[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Scroll progress
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Content opacity - fades in during the last 20% of the scroll
    const contentOpacity = useTransform(scrollYProgress, [0.8, 0.95], [0, 1]);
    const contentY = useTransform(scrollYProgress, [0.8, 0.95], [30, 0]);

    // Frame count
    const frameCount = 160;

    // Preload images
    useEffect(() => {
        const loadImages = async () => {
            const loadedImages: HTMLImageElement[] = [];
            const promises: Promise<void>[] = [];

            for (let i = 0; i < frameCount; i++) {
                const promise = new Promise<void>((resolve) => {
                    const img = new Image();
                    img.src = `/sequence2/frame_${i.toString().padStart(3, "0")}_delay-0.05s.png`;
                    img.onload = () => {
                        loadedImages[i] = img;
                        resolve();
                    };
                    img.onerror = () => {
                        // Handle error or skip
                        console.error(`Failed to load frame ${i}`);
                        resolve();
                    };
                });
                promises.push(promise);
            }

            await Promise.all(promises);
            setImages(loadedImages);
            setIsLoaded(true);
        };

        loadImages();
    }, []);

    // Draw frame
    useEffect(() => {
        if (!isLoaded || images.length === 0) return;

        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context) return;

        // Initial draw
        const render = (index: number) => {
            const img = images[index];
            if (!img) return;

            // Resize canvas to match window
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Object-fit: cover calculation
            const targetRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;

            let drawWidth = canvas.width;
            let drawHeight = canvas.height;
            let offsetX = 0;
            let offsetY = 0;

            if (imgRatio > targetRatio) {
                // Image is wider than canvas
                drawWidth = canvas.height * imgRatio;
                offsetX = (canvas.width - drawWidth) / 2;
            } else {
                // Image is taller than canvas
                drawHeight = canvas.width / imgRatio;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        };

        // Render loop based on scroll
        const unsubscribe = scrollYProgress.on("change", (latest) => {
            const frameIndex = Math.min(
                frameCount - 1,
                Math.floor(latest * (frameCount - 1))
            );
            requestAnimationFrame(() => render(frameIndex));
        });

        // Force initial render
        render(0);

        // Resize handler
        const handleResize = () => {
            // Re-render current frame on resize
            const currentProgress = scrollYProgress.get();
            const frameIndex = Math.min(
                frameCount - 1,
                Math.floor(currentProgress * (frameCount - 1))
            );
            render(frameIndex);
        };
        window.addEventListener("resize", handleResize);

        return () => {
            unsubscribe();
            window.removeEventListener("resize", handleResize);
        };
    }, [isLoaded, images, scrollYProgress]);

    // Loading State (optional, keeping it black/clean)
    // if (!isLoaded) {
    //     return <div ref={containerRef} className="h-screen w-full bg-black" />;
    // }

    return (
        <div ref={containerRef} className="relative h-[500vh] bg-black">
            {!isLoaded && (
                <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
                    <video
                        src="/Animation - 1712217414998.webm"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full max-w-xs md:max-w-sm object-contain"
                    />
                </div>
            )}

            <div className="sticky top-0 h-screen w-full overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Overlay Content - Same as Hero.tsx */}
                <motion.div
                    style={{ opacity: contentOpacity, y: contentY }}
                    className="absolute inset-0 z-10 container mx-auto px-4 flex flex-col items-center justify-center text-center pointer-events-none"
                >
                    {/* 
                       Pointer events auto for buttons.
                       The container is pointer-events-none to allow clicking through if needed, 
                       but technically sticky container is on top. 
                       Actually, the canvas is the background. Title is on top.
                       Buttons need pointer-events-auto.
                     */}
                    <div className="pointer-events-auto">
                        <h1 className="text-5xl md:text-8xl font-heading font-bold text-white mb-6 tracking-tighter">
                            TRAIN <span className="text-primary text-glow">HARD</span>. <br />
                            STAY <span className="text-primary text-glow">STRONG</span>.
                            <span className="sr-only">MFP Gym - Best Gym in Periyanaickenpalayam, Coimbatore</span>
                        </h1>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Button
                                asChild
                                className="bg-[#E50914] hover:bg-[#b2070f] text-white rounded-full h-12 px-8 text-sm font-bold tracking-[0.2em] shadow-[0_0_20px_-5px_#E50914] transition-all hover:scale-105 hover:shadow-[0_0_30px_-5px_#E50914]"
                            >
                                <Link href="/register" className="flex items-center gap-2">
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
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

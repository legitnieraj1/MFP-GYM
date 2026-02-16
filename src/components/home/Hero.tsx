"use client";

import { useState, useEffect } from "react";
import ScrollyCanvasHero from "./ScrollyCanvasHero";
import MobileHero from "./MobileHero";

export function Hero() {
    // Default to false (Mobile) to match mobile-first SSR if possible, 
    // or just handle client-only rendering for the hero to be safe.
    const [isDesktop, setIsDesktop] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const checkScreen = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    // Prevent hydration mismatch by rendering nothing or a robust placeholder until mounted.
    // However, for SEO/Performance, rendering MobileHero by default might be better if SSR matches.
    // But since we are changing component trees significantly, a small flash is safer than hydration errors.
    if (!isMounted) {
        return <div className="h-screen bg-black"></div>;
    }

    return (
        <>
            {isDesktop ? <ScrollyCanvasHero /> : <MobileHero />}
        </>
    );
}

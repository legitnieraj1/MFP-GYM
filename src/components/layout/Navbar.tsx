"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
    { name: "Home", href: "/#home" },
    { name: "About", href: "/#about" },
    { name: "Trainers", href: "/#trainers" },
    { name: "Plans", href: "/#plans" },
    { name: "Diet AI", href: "/diet" }, // Separate page
    { name: "Contact", href: "/#contact" },
];

import { createBrowserClient } from "@supabase/ssr";
import { User as UserIcon } from "lucide-react";

// ... inside Navbar component ...

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
        };
    }, [supabase]);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isMobileMenuOpen]);

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    isScrolled
                        ? "bg-black/80 backdrop-blur-md border-b border-white/10 py-4"
                        : "bg-transparent py-6"
                )}
            >
                <div className="container mx-auto px-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group z-50">
                        <div className="relative w-48 h-16">
                            <img
                                src="/mfp logoo.png"
                                alt="MFP GYM Logo"
                                className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-sm font-medium hover:text-primary transition-colors uppercase tracking-wider"
                            >
                                {link.name}
                            </Link>
                        ))}

                        {user ? (
                            <Link href="/dashboard">
                                <Button variant="ghost" className="text-white hover:text-[#E50914] flex items-center gap-2 font-bold uppercase tracking-wider hover:bg-white/10">
                                    <UserIcon className="w-5 h-5 text-[#E50914]" />
                                    Dashboard
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="premium" className="font-bold">
                                <Link href="/register">JOIN NOW</Link>
                            </Button>
                        )}
                    </div>

                    {/* Mobile Toggle Button */}
                    <button
                        className="md:hidden text-white z-50"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={32} /> : <Menu size={32} />}
                    </button>
                </div>
            </nav>

            {/* FULL SCREEN MOBILE MENU OVERLAY */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-black md:hidden flex flex-col items-center justify-center"
                    >
                        <div className="flex flex-col items-center gap-8 p-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-4xl font-black text-white hover:text-[#E50914] transition-colors uppercase tracking-widest"
                                >
                                    {link.name}
                                </Link>
                            ))}

                            {user ? (
                                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button
                                        variant="default"
                                        className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold px-8 py-6 text-xl rounded-full shadow-[0_0_20px_-5px_#E50914] mt-4 uppercase tracking-widest"
                                    >
                                        <UserIcon className="w-6 h-6 mr-2" />
                                        Dashboard
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    variant="default"
                                    className="bg-[#E50914] hover:bg-[#E50914]/90 text-white font-bold px-12 py-6 text-2xl rounded-full shadow-[0_0_20px_-5px_#E50914] mt-8 uppercase tracking-widest"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Link href="/register">JOIN NOW</Link>
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

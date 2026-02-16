"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User as UserIcon, LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
    { name: "Home", href: "/#home" },
    { name: "About", href: "/#about" },
    { name: "Trainers", href: "/#trainers" },
    { name: "Plans", href: "/#plans" },
    { name: "Diet AI", href: "/diet" },
    { name: "Contact", href: "/#contact" },
];

export function Navbar({ session = null }: { session?: any }) {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Use session prop if available, otherwise just rely on it. 
    // We can also have local user state if we were fetching it, but prop is better.
    const user = session?.userId ? { id: session.userId } : null;

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
    }, [isMobileMenuOpen]);

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.reload(); // Force refresh to clear session and update UI
    };

    return (
        <>
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
                    isScrolled
                        ? "bg-black/90 backdrop-blur-md border-b border-red-900/20 py-4 shadow-lg shadow-red-900/5"
                        : "bg-transparent py-6"
                )}
            >
                <div className="container mx-auto px-4 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group z-50">
                        <div className="relative w-48 h-12 md:h-16">
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
                                className="text-sm font-medium hover:text-red-500 transition-colors uppercase tracking-wider"
                            >
                                {link.name}
                            </Link>
                        ))}

                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link href="/dashboard">
                                    <Button variant="ghost" className="text-white hover:text-red-500 hover:bg-red-900/10 font-bold uppercase tracking-wider flex items-center gap-2">
                                        <LayoutDashboard className="w-5 h-5 text-red-500" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <Button variant="ghost" onClick={handleLogout} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                                    <LogOut className="w-5 h-5" />
                                </Button>
                            </div>
                        ) : (
                            <Link href="/signup">
                                <Button variant="default" className="bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider">
                                    JOIN NOW
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Toggle Button */}
                    <button
                        className="md:hidden text-white z-50 hover:text-red-500 transition-colors"
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
                        className="fixed inset-0 z-40 bg-black/95 md:hidden flex flex-col items-center justify-center backdrop-blur-xl"
                    >
                        <div className="flex flex-col items-center gap-8 p-4 w-full max-w-sm">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-3xl font-black text-white hover:text-red-500 transition-colors uppercase tracking-widest text-center"
                                >
                                    {link.name}
                                </Link>
                            ))}

                            <div className="w-full h-px bg-zinc-800 my-4" />

                            {user ? (
                                <div className="flex flex-col gap-4 w-full">
                                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                                        <Button
                                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-xl rounded-full shadow-lg shadow-red-900/20 uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <LayoutDashboard className="w-6 h-6" />
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 py-6 text-lg rounded-full"
                                    >
                                        Logout
                                    </Button>
                                </div>
                            ) : (
                                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                                    <Button
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-2xl rounded-full shadow-lg shadow-red-900/20 mt-4 uppercase tracking-widest"
                                    >
                                        JOIN NOW
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

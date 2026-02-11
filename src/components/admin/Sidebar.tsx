"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    CreditCard,
    Utensils,
    Bell,
    Dumbbell,
    Settings,
    LogOut,
    Menu,
    X,
    UserPlus,
    ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const sidebarLinks = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Members", href: "/admin/members", icon: Users },
    { name: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
    { name: "Payments", href: "/admin/payments", icon: CreditCard },
    { name: "Diet AI", href: "/admin/diet-ai", icon: Utensils },
    { name: "Notifications", href: "/admin/notifications", icon: Bell },
    { name: "Trainers", href: "/admin/trainers", icon: Dumbbell },
    { name: "Members Log", href: "/admin/members-log", icon: UserPlus }, // Changed icon and name to label
    { name: "Today's Log", href: "/admin/attendance", icon: ClipboardList }, // Added new item
    { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile Toggle */}
            <button
                className="md:hidden fixed top-4 right-4 z-50 p-2 bg-zinc-900 rounded-md text-white border border-white/10 hover:bg-zinc-800 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-0 z-40 h-screen w-64 bg-[#0A0A0A] border-r border-white/10 transition-transform duration-300 ease-in-out overflow-y-auto",
                    "md:left-0 md:translate-x-0 md:border-r", // Desktop: Left side, always visible
                    "right-0 border-l md:border-l-0", // Mobile: Right side
                    isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0" // Mobile slide logic
                )}
            >
                <div className="p-6 border-b border-white/10">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <Dumbbell className="w-8 h-8 text-[#E50914]" />
                        <span className="text-xl font-bold tracking-widest text-white">
                            MFP <span className="text-[#E50914]">ADMIN</span>
                        </span>
                    </Link>
                </div>

                <nav className="p-4 space-y-2">
                    {sidebarLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                    isActive
                                        ? "bg-[#E50914]/10 text-[#E50914]"
                                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                                onClick={() => setIsOpen(false)} // Close on mobile click
                            >
                                <Icon size={20} className={cn(isActive && "text-[#E50914]")} />
                                <span className={cn("font-medium", isActive && "font-bold")}>
                                    {link.name}
                                </span>
                                {isActive && (
                                    <motion.div
                                        layoutId="active-pill"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E50914] shadow-[0_0_8px_#E50914]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0A0A0A]">
                    <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}

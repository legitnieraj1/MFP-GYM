import { Dumbbell, Instagram, Facebook, Twitter } from "lucide-react";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 py-12">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Brand */}
                <div className="space-y-4">
                    <Link href="/" className="flex items-center gap-2">
                        <Dumbbell className="w-6 h-6 text-primary" />
                        <span className="text-xl font-heading font-bold tracking-widest text-white">
                            MFP <span className="text-primary">GYM</span>
                        </span>
                    </Link>
                    <p className="text-muted-foreground text-sm">
                        Forging elite bodies and unbreakable minds. Join the revolution.
                    </p>
                    <p className="text-muted-foreground text-xs mt-4">
                        If you’re looking to take your fitness to the next level we are here to help you. Get trained with me @romanprabhur. We are trained in creating and implementing safe and effective exercise programs for our clients. We keep you physically active to improve your brain health, help manage weight, reduce the risk of disease, strengthen bones and muscles, improve your ability to do everyday activities.
                    </p>
                </div>

                {/* Facilities & Services */}
                <div>
                    <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Facilities & Services</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>Contest preparation</li>
                        <li>Personal training</li>
                        <li>Weight loss section</li>
                        <li>Weight gaining section</li>
                        <li>Diet plans</li>
                        <li>Supplement guidance</li>
                        <li>24/7 audio and video call support</li>
                        <li>Weekly monitoring of clients</li>
                        <li>Main workout area</li>
                        <li>Cardio area/exercise theatre</li>
                        <li>Group exercise classes</li>
                        <li>Sports facilities</li>
                    </ul>
                </div>

                {/* Links */}
                <div>
                    <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Quick Links</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link href="#about" className="hover:text-primary">About Us</Link></li>
                        <li><Link href="#trainers" className="hover:text-primary">Trainers</Link></li>
                        <li><Link href="#plans" className="hover:text-primary">Membership</Link></li>
                        <li><Link href="/diet" className="hover:text-primary">Diet AI</Link></li>
                    </ul>
                </div>

                {/* Contact column removed as per request */}
            </div>
            <div className="border-t border-white/5 mt-12 pt-8 text-center text-xs text-muted-foreground">
                © {new Date().getFullYear()} MFP GYM. All rights reserved. Built for Greatness.
            </div>
        </footer>
    );
}

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
                        The best gym in Periyanaickenpalayam, Coimbatore. Forging elite bodies and unbreakable minds since day one.
                    </p>
                    <p className="text-muted-foreground text-xs mt-4">
                        MFP Gym (Team MFP) is the top-rated gym in Periyanaickenpalayam offering personal training, body transformation programs, weight loss and weight gain coaching, contest preparation, and AI-powered diet plans. Founded by Roman Prabhur, we provide safe and effective fitness programs with modern equipment, cardio theatre, group exercise classes, and 24/7 support. Whether you&apos;re searching for the best gym in Periyanaickenpalayam or gyms near Periyanaickenpalayam, Team MFP is your ultimate fitness destination.
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

                {/* Contact & Hours */}
                <div>
                    <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Contact & Hours</h4>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                        <li>
                            <a href="mailto:mfppnproman@gmail.com" className="hover:text-primary break-all">
                                mfppnproman@gmail.com
                            </a>
                        </li>
                        <li>
                            <p className="text-white/80 font-medium mb-1">Mon - Sat:</p>
                            <p>Morning: 5 AM - 11 AM</p>
                            <p>Evening: 5 PM - 9 PM</p>
                        </li>
                        <li>
                            <p className="text-primary font-medium">Sunday: Holiday (Rest)</p>
                        </li>
                    </ul>
                </div>

                {/* Contact column removed as per request */}
            </div>
            <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row items-center justify-center gap-2 text-xs text-muted-foreground text-center">
                <span>&copy; {new Date().getFullYear()} MFP GYM. All rights reserved</span>
                <span className="hidden md:inline">|</span>
                <span className="flex items-center gap-1">
                    Designed and powered by
                    <Link href="https://elevexsocials.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center transition-opacity hover:opacity-80">
                        <img src="/elevexsocialslogo.png" alt="Elevex Socials" className="h-14 w-auto" />
                    </Link>
                </span>
            </div>
        </footer>
    );
}

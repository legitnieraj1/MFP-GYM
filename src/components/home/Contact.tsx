"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Need to create this
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { motion } from "framer-motion";

export function Contact() {
    return (
        <section className="py-24 bg-black" id="contact">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
                                VISIT <span className="text-primary">MFP GYM</span> PERIYANAICKENPALAYAM
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                Ready to start your fitness transformation? Visit the best gym in Periyanaickenpalayam or contact Team MFP today.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <a
                                href="https://maps.google.com/?q=TEAM+MFP+Periyanaickenpalayam"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 group cursor-pointer"
                            >
                                <div className="p-3 bg-white/5 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">Location</h4>
                                    <p className="text-muted-foreground">No 17, Bhagat Singh Nagar, Periyanaickenpalayam, Tamil Nadu 641020</p>
                                </div>
                            </a>

                            <a
                                href="tel:08098834154"
                                className="flex items-center gap-4 group cursor-pointer"
                            >
                                <div className="p-3 bg-white/5 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">Phone</h4>
                                    <p className="text-muted-foreground hover:text-white transition-colors">080988 34154</p>
                                </div>
                            </a>

                            <a
                                href="mailto:mfppnproman@gmail.com"
                                className="flex items-center gap-4 group cursor-pointer"
                            >
                                <div className="p-3 bg-white/5 rounded-full text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white group-hover:text-primary transition-colors">Email</h4>
                                    <p className="text-muted-foreground hover:text-white transition-colors">mfppnproman@gmail.com</p>
                                </div>
                            </a>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/5 rounded-full text-primary">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white mb-2">Opening Hours</h4>
                                    <p className="text-muted-foreground font-medium mb-1">Mon - Sat:</p>
                                    <p className="text-muted-foreground ml-2">Morning: 5 AM - 11 AM</p>
                                    <p className="text-muted-foreground ml-2">Evening: 5 PM - 9 PM</p>
                                    <p className="text-primary font-medium mt-2">Sunday: Holiday (Rest)</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <a
                                    href="https://www.instagram.com/mfp_pnp_/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-3 bg-white/5 rounded-full text-primary hover:bg-primary hover:text-white transition-colors"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="24"
                                        height="24"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="w-6 h-6"
                                    >
                                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                                    </svg>
                                </a>
                                <div>
                                    <h4 className="font-bold text-white">Instagram</h4>
                                    <a
                                        href="https://www.instagram.com/mfp_pnp_/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        @mfp_pnp_
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Form  & Map */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >


                        {/* Google Maps Embed */}
                        <div className="w-full h-64 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 border border-white/10">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3914.809079942646!2d76.9505951!3d11.1551686!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba8f1b911fccbe3%3A0x5467fb731d5cc4e4!2sTEAM%20MFP!5e0!3m2!1sen!2sin!4v1707060000000!5m2!1sen!2sin"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                title="MFP Gym Location - Best Gym in Periyanaickenpalayam, Coimbatore"
                            ></iframe>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

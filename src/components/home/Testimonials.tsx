"use client";

import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCallback } from "react";

const testimonials = [
    {
        name: "Thiyagu R",
        initial: "T",
        role: "Member",
        content: "This gym is genuinely one of the best. The trainers are extremely knowledgeable and customize everything for you. It feels more like a home than a gym. You’re in great hands, and if you trust them, you’ll definitely see results!",
        rating: 5,
    },
    {
        name: "Avinash R",
        initial: "A",
        role: "Member",
        content: "Great gym for muscle building and overall fitness! The gym is spacious, well-equipped with modern machines, and has a very energetic vibe. Trainers and staff are supportive.",
        rating: 5,
    },
    {
        name: "Vijay",
        initial: "V",
        role: "Member",
        content: "The gym has modern machines and enough weights for all workouts. The gym is well-maintained, hygienic, and comfortable to train in. Motivating vibe with good music and supportive members.",
        rating: 5,
    },
    {
        name: "Gowri Manohar M K",
        initial: "G",
        role: "Local Guide",
        content: "I had a great experience with the MFP team during my weight loss journey. The support and guidance were excellent throughout. A special thanks to my personal trainer, Pradesh, who was extremely flexible and motivating.",
        rating: 5,
    },
    {
        name: "Sashibhushan M S CSE",
        initial: "S",
        role: "Member",
        content: "It's been 2½ years working with the TEAM MFP. Regular maintenance and cleaning help clients to maintain their hygiene. Beginners are trained by trainers to avoid injuries and see the results.",
        rating: 5,
    },
    {
        name: "Sanjeev Sanju",
        initial: "S",
        role: "Member",
        content: "I absolutely love working out here! The trainers are super supportive and push you in the right way. The machines are in great condition, and the gym is always clean and comfortable.",
        rating: 5,
    },
    {
        name: "PK Praveen",
        initial: "P",
        role: "Local Guide",
        content: "MFP Gym is a great place to train. The trainer provides excellent coaching along with a proper diet plan. Very humble and friendly behavior. The fee structure is reasonable and affordable for everyone.",
        rating: 5,
    },
    {
        name: "Krithika Dayalan",
        initial: "K",
        role: "Member",
        content: "All hail Prabhu, the main king 👑 — guided by his warriors Pradesh and Lokesh, the hands that shape the kingdom of strength! MFP Gym has been amazing! The trainers are super supportive.",
        rating: 5,
    },
    {
        name: "Kavitha R",
        initial: "K",
        role: "Member",
        content: "Joined this gym a few weeks ago. It’s clean, well equipped and motivating. Trainers are supportive and helpful. I’m happy with my decision to join.",
        rating: 5,
    },
    {
        name: "Amitha Sureshbabu",
        initial: "A",
        role: "Member",
        content: "Amazing gym with great ambiance, modern equipment, and supportive trainers. The workouts are engaging, the space is hygienic, and the staff truly cares about members’ progress.",
        rating: 5,
    },
    {
        name: "Sriram Pk",
        initial: "S",
        role: "Member",
        content: "This gym is excellent! The trainers are very knowledgeable, friendly, and always ready to guide you. They motivate and correct your form, making workouts safe and effective.",
        rating: 5,
    },
    {
        name: "Durgash r.t",
        initial: "D",
        role: "Member",
        content: "One of the best gyms I’ve ever known with good ambience and well-experienced trainers. There are extensive facilities for whatever type of workout you might be into. Apart from machine workouts they also conduct circuit sessions.",
        rating: 5,
    },
    {
        name: "Gunasekaran R",
        initial: "G",
        role: "Member",
        content: "Love the gym!! Well equipped and maintained gym. Trainers here are very knowledgeable, approachable and friendly. Highly recommended for both beginners to experienced gym goers.",
        rating: 5,
    },
    {
        name: "Kruthik J",
        initial: "K",
        role: "Member",
        content: "I’ve been training here for a long while and the experience has been amazing. The gym has all the equipment you need and the atmosphere is super motivating. Special thanks to Pradesh Naa.",
        rating: 5,
    },
];

export function Testimonials() {
    const [emblaRef] = useEmblaCarousel({ loop: true, align: "center" }, [Autoplay({ delay: 5000 })]);

    return (
        <section className="py-24 bg-zinc-950/50" id="testimonials">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-5xl font-heading font-bold text-center text-white mb-12">
                    STORIES OF <span className="text-primary">TRIUMPH</span>
                </h2>

                <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
                    <div className="flex -ml-4">
                        {testimonials.map((t, index) => (
                            <div key={index} className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.33%] min-w-0 pl-4">
                                <div className="p-4 h-full">
                                    <Card className="bg-black border-white/5 h-full relative group hover:border-primary/30 transition-colors">
                                        <Quote className="absolute top-6 right-6 text-white/10 w-12 h-12 group-hover:text-primary/20 transition-colors" />
                                        <CardContent className="pt-8">
                                            <div className="flex gap-1 mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'text-yellow-500 fill-yellow-500' : 'text-zinc-700'}`} />
                                                ))}
                                            </div>
                                            <p className="text-gray-300 mb-6 italic leading-relaxed">"{t.content}"</p>

                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-red-900 flex items-center justify-center text-white font-bold text-lg">
                                                    {t.initial}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-white">{t.name}</h4>
                                                    <p className="text-xs text-primary uppercase tracking-wider">{t.role}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

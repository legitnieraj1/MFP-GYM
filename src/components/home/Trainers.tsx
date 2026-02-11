"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Instagram, Twitter } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

const trainers = [
    {
        name: "Roman Prabhur",
        specialization: "Head Trainer & Founder",
        bio: "The driving force behind MFP Gym. Dedicated to forging elite athletes.",
        image: "/roman prabhur - head trainer.jpg",
        instagram: "https://www.instagram.com/romanprabhur/",
    },
    {
        name: "Pradesh Rajan",
        specialization: "Fitness Trainer",
        bio: "Expert in functional training and body transformation. Committed to your progress.",
        image: "/coach 2.jpg",
        instagram: "https://www.instagram.com/pradesh_rajan/",
    },
    {
        name: "Logesh",
        specialization: "Fitness Trainer",
        bio: "Dedicated to helping you achieve your strength and conditioning goals.",
        image: "/coach 3.jpg",
        instagram: "https://www.instagram.com/___l__o__g__e__s__h___/",
        position: "center 20%",
    },
];

export function Trainers() {
    const [emblaRef] = useEmblaCarousel({ loop: false, align: 'start' });

    return (
        <section className="py-24 bg-zinc-950" id="trainers">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl md:text-5xl font-heading font-bold text-white mb-4"
                    >
                        MEET THE <span className="text-primary">ELITE</span>
                    </motion.h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Our trainers are more than just coaches; they are mentors dedicated to pushing you beyond your perceived limits.
                    </p>
                </div>

                {/* Desktop Grid */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-8">
                    {trainers.map((trainer, index) => (
                        <TrainerCard key={index} trainer={trainer} index={index} />
                    ))}
                </div>

                {/* Mobile Carousel */}
                <div className="md:hidden">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex">
                            {trainers.map((trainer, index) => (
                                <div key={index} className="flex-[0_0_85%] min-w-0 pl-4 first:pl-0">
                                    <TrainerCard trainer={trainer} index={index} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function TrainerCard({ trainer, index }: { trainer: any, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.2 }}
            whileHover={{ y: -10 }}
            className="h-full"
        >
            <Card className="bg-zinc-900 border-zinc-800 overflow-hidden group hover:border-primary/50 transition-colors duration-300 h-full flex flex-col">
                <div className="relative h-80 overflow-hidden shrink-0">
                    <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                        style={{
                            backgroundImage: `url('${trainer.image}')`,
                            backgroundPosition: trainer.position || 'center'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Social Icons Overlay */}
                    <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                        <a
                            href={trainer.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-primary/20 backdrop-blur-sm rounded-full text-white hover:bg-primary cursor-pointer transition-colors"
                        >
                            <Instagram size={18} />
                        </a>
                    </div>
                </div>

                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white group-hover:text-primary transition-colors">
                        {trainer.name}
                    </CardTitle>
                    <p className="text-sm font-bold text-primary uppercase tracking-wider">{trainer.specialization}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                    <CardDescription className="text-zinc-400">
                        {trainer.bio}
                    </CardDescription>
                </CardContent>
            </Card>
        </motion.div>
    );
}

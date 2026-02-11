import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Trainers } from "@/components/home/Trainers";
import { Membership } from "@/components/home/Membership";
import { Testimonials } from "@/components/home/Testimonials";
import { Contact } from "@/components/home/Contact";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      <Navbar />
      <Hero />
      <About />
      <Trainers />
      <Membership />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}

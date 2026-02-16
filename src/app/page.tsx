import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { Trainers } from "@/components/home/Trainers";
import { Membership } from "@/components/home/Membership";
import { Testimonials } from "@/components/home/Testimonials";
import { Contact } from "@/components/home/Contact";
import { getSession } from "@/lib/auth";

export default async function Home() {
  const session = await getSession();
  let user = null;

  if (session?.userId) {
    const { supabaseAdmin } = await import("@/lib/supabase");
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("members")
        .select("*")
        .eq("id", session.userId)
        .single();
      user = data;
    }
  }


  return (
    <main className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      <Navbar session={session} />
      <Hero />
      <About />
      <Trainers />
      <Membership user={user} />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}

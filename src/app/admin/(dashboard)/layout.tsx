import { Sidebar } from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session?.userId) {
        redirect("/admin/login");
    }

    if (!supabaseAdmin) {
        return <div>Configuration error.</div>;
    }

    // Verify admin role strictly from DB (or trust session if we trust the secret, but DB is safer)
    const { data: userData, error } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("id", session.userId)
        .single();

    if (error || !userData || (userData.role !== "ADMIN" && userData.role !== "DALUXEADMIN")) {
        redirect("/admin/login");
    }

    return (
        <div className="flex min-h-screen bg-black">
            <Sidebar />
            <main className="flex-1 p-8 overflow-y-auto md:ml-64">
                {children}
            </main>
        </div>
    );
}

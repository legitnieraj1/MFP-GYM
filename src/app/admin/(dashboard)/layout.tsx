import { Sidebar } from "@/components/admin/Sidebar";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/admin/login");
    }

    // Verify admin role
    // We can use Supabase Admin client here or just query public.users if RLS allows reading own role
    // Ideally, we should check claim or query DB.
    // For now, let's query the 'users' table using the authenticated client (RLS should allow reading own role)
    // OR use admin client if we want to be sure. But usually layout uses standard client.

    const { data: userData, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (error || !userData || (userData.role !== "ADMIN" && userData.role !== "DALUXEADMIN")) {
        // If not admin, redirect to home or show denied
        console.error("Access denied:", error, userData);
        redirect("/admin/login"); // or a 403 page
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

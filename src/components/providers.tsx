"use client";

// import { SessionProvider } from "next-auth/react"; 
// We are moving to Supabase, so we might not need a global provider unless we use a custom one.
// For now, just render children.

export function Providers({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

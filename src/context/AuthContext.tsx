"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type AuthUser = {
    id: string;
    name: string;
    mobile: string;
    membership_type?: string;
    membership_expiry?: string;
    role: string;
};

type AuthState = {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setUser(data.user ?? null);
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                refresh: fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

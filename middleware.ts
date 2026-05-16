import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/dashboard", "/admin", "/attendance"];
const authRoutes = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProtectedRoute =
        protectedRoutes.some((r) => path.startsWith(r)) && path !== "/admin/login";
    const isAuthRoute = authRoutes.includes(path);

    const cookie = req.cookies.get("session")?.value;
    const session = cookie ? await decrypt(cookie).catch(() => null) : null;

    // Unauthenticated → redirect to /login, preserving the original path for redirect-back
    if (isProtectedRoute && !session?.userId) {
        const loginUrl = new URL("/login", req.nextUrl);
        loginUrl.searchParams.set("redirect", path);
        return NextResponse.redirect(loginUrl);
    }

    // Already authenticated → skip login/signup, send to intended destination
    if (isAuthRoute && session?.userId) {
        const redirectTo = req.nextUrl.searchParams.get("redirect") || "/dashboard";
        // Only allow relative paths to prevent open-redirect
        const safe = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
        return NextResponse.redirect(new URL(safe, req.nextUrl));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

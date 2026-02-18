import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard", "/admin"];
const authRoutes = ["/login", "/signup"];

export default async function middleware(req: NextRequest) {
    // 2. Check if the current route is protected or public
    const path = req.nextUrl.pathname;
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) && path !== "/admin/login";
    const isAuthRoute = authRoutes.includes(path);

    // 3. Decrypt the session from the cookie
    const cookie = req.cookies.get("session")?.value;
    const session = cookie ? await decrypt(cookie).catch((err) => {
        console.error("Middleware: Decrypt failed", err);
        return null; // Return null if decryption fails
    }) : null;

    // 4. Redirect to /login if the user is not authenticated and tries to access a protected route
    if (isProtectedRoute && !session?.userId) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    // 5. Redirect to /dashboard if the user is authenticated and tries to access login/signup
    if (isAuthRoute && session?.userId) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};

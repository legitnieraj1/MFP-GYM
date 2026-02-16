import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { decrypt, createSession } from "@/lib/session";
import { redirect } from "next/navigation";

export async function hashPin(pin: string): Promise<string> {
    return await bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(pin, hash);
}

export function formatMobile(mobile: string): string {
    // Remove all non-numeric characters
    let cleaned = mobile.replace(/\D/g, "");
    // Strip +91 or 91 country code prefix (if number is > 10 digits)
    if (cleaned.length > 10 && cleaned.startsWith("91")) {
        cleaned = cleaned.slice(2);
    }
    return cleaned;
}

export function validatePin(pin: string): boolean {
    // Allow enrollment numbers (any length digits) or 4-digit PINs
    return /^\d+$/.test(pin) && pin.length >= 1;
}

export async function getSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return null;
    try {
        return await decrypt(sessionCookie);
    } catch (error) {
        return null;
    }
}

export async function loginUser(userId: string, role: string = "MEMBER") {
    await createSession(userId, role);
}

export async function logoutUser() {
    (await cookies()).delete("session");
}

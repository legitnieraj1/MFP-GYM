import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET || "default_secret_key_change_me_in_prod";
const key = new TextEncoder().encode(secretKey);

export type SessionPayload = {
    userId: string;
    role: string;
    expiresAt: Date;
};

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("3650d") // 10 years
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function createSession(userId: string, role: string) {
    const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
    const session = await encrypt({ userId, role, expiresAt });

    (await cookies()).set("session", session, {
        httpOnly: true,
        secure: false, // Force false for localhost debugging
        expires: expiresAt,
        sameSite: "lax",
        path: "/",
    });
}

export async function deleteSession() {
    (await cookies()).delete("session");
}

export async function getSession() {
    const session = (await cookies()).get("session")?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (error) {
        return null;
    }
}

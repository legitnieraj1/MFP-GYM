import { compare, hash } from "bcrypt-ts";

export function generateOTP(length: number = 6): string {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

export async function hashOTP(otp: string): Promise<string> {
    return await hash(otp, 10);
}

export async function verifyOTP(otp: string, hashedOtp: string): Promise<boolean> {
    return await compare(otp, hashedOtp);
}

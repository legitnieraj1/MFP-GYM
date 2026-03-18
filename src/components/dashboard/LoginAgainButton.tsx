"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function LoginAgainButton() {
    const router = useRouter();

    const handleLoginAgain = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
    };

    return (
        <Button className="bg-red-600 hover:bg-red-700" onClick={handleLoginAgain}>
            Login Again
        </Button>
    );
}

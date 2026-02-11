"use client";

import { useState, useEffect } from "react";
import { saveSubscription } from "@/app/actions/notifications";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushNotificationManager() {
    const [isSupported, setIsSupported] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ("serviceWorker" in navigator && "PushManager" in window) {
            setIsSupported(true);
            registerServiceWorker();
        }
    }, []);

    async function registerServiceWorker() {
        const registration = await navigator.serviceWorker.register("/sw.js", {
            scope: "/",
            updateViaCache: "none",
        });
        const sub = await registration.pushManager.getSubscription();
        setSubscription(sub);
    }

    async function subscribeToPush() {
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
                ),
            });
            setSubscription(sub);

            // Send subscription to backend
            const result = await saveSubscription(JSON.stringify(sub));
            if (result.success) {
                alert("Notifications enabled! You will now receive fee reminders.");
            } else {
                alert("Failed to save subscription.");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to subscribe to notifications.");
        }
    }

    async function unsubscribeFromPush() {
        await subscription?.unsubscribe();
        setSubscription(null);
        // Ideally should also clear from DB, but for now just unsubscribing locally stops notifications
    }

    if (!isSupported) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {subscription ? (
                // Optional: Show nothing if already subscribed, or a small indicator
                // For now, let's keep it minimal
                <Button
                    variant="ghost"
                    size="icon"
                    className="bg-zinc-800 text-green-500 rounded-full shadow-lg hover:bg-zinc-700 hover:text-red-500"
                    onClick={unsubscribeFromPush}
                    title="Notifications Enabled (Click to Unsubscribe)"
                >
                    <Bell size={20} />
                </Button>
            ) : (
                <Button
                    onClick={subscribeToPush}
                    className="bg-[#E50914] text-white rounded-full shadow-[0_0_15px_-5px_#E50914] animate-pulse hover:animate-none"
                    size="sm"
                >
                    <Bell className="mr-2 h-4 w-4" /> Enable Updates
                </Button>
            )}
        </div>
    );
}

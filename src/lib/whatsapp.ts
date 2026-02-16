import { supabase } from "@/lib/supabase";

export async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.error("WhatsApp credentials missing");
        return false;
    }

    try {
        const res = await fetch(`https://graph.facebook.com/v22.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: phone,
                type: "text",
                text: { body: text },
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            console.error("WhatsApp API Error:", JSON.stringify(errorData));
            return false;
        }

        return true;
    } catch (error) {
        console.error("WhatsApp Send Error:", error);
        return false;
    }
}

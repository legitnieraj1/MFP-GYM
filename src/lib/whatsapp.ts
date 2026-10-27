import { supabase } from "@/lib/supabase";

// Meta only allows free-form "text" messages inside a 24h customer-service
// window (i.e. the member messaged the business recently). Proactive,
// business-initiated messages like expiry reminders must use a pre-approved
// template — sending "text" for those gets rejected by the Graph API.
export async function sendWhatsAppTemplateMessage(
    phone: string,
    templateName: string,
    languageCode: string,
    bodyParams: string[]
): Promise<{ ok: boolean; error?: string }> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.error("WhatsApp credentials missing");
        return { ok: false, error: "missing_credentials" };
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
                type: "template",
                template: {
                    name: templateName,
                    language: { code: languageCode },
                    components: bodyParams.length
                        ? [
                            {
                                type: "body",
                                parameters: bodyParams.map((text) => ({ type: "text", text })),
                            },
                        ]
                        : undefined,
                },
            }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            const message = errorData?.error?.message || `HTTP ${res.status}`;
            console.error("WhatsApp Template API Error:", JSON.stringify(errorData));
            return { ok: false, error: message };
        }

        return { ok: true };
    } catch (error) {
        console.error("WhatsApp Template Send Error:", error);
        return { ok: false, error: error instanceof Error ? error.message : "unknown_error" };
    }
}

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

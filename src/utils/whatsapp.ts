// Normalizes a raw phone number into a wa.me-ready international number.
// All members are Indian — a bare 10-digit number gets the 91 country code
// prefixed so WhatsApp doesn't misparse it as a different country (e.g. a
// number starting with 96/97 getting read as +96.../+97... instead of 91xxxx).
function normalizePhone(rawPhone: string): string {
    let phone = rawPhone.trim().replace(/[^\d]/g, '');

    if (phone.length === 10) {
        phone = `91${phone}`;
    } else if (phone.length === 11 && phone.startsWith('0')) {
        phone = `91${phone.slice(1)}`;
    }

    return phone;
}

export function buildReminderInfo(member: any): {
    hasPhone: boolean;
    phone: string;
    isExpired: boolean;
    message: string;
    url: string;
} {
    const hasPhone = !!(member && member.phone);
    if (!hasPhone) {
        return { hasPhone: false, phone: "", isExpired: false, message: "", url: "" };
    }

    const phone = normalizePhone(member.phone);

    // Check if membership is expired or expiring
    const isExpired = member.membership?.status === 'EXPIRED' ||
        (member.membership?.end_date && new Date(member.membership.end_date) < new Date());

    const expiryText = isExpired ? "has expired" : "is about to expire";
    const name = member.name || "Member";

    const message = `Dear ${name},

Your MFP Gym membership ${expiryText}.
Kindly renew your fee to continue your fitness journey.

– MFP Gym`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${phone}?text=${encodedMessage}`;

    return { hasPhone: true, phone, isExpired, message, url };
}

export function openWhatsAppReminder(member: any) {
    const info = buildReminderInfo(member);
    if (!info.hasPhone) return;

    window.open(info.url, '_blank');
}

export function openWhatsAppBirthdayWish(member: { name: string; phone: string }) {
    if (!member || !member.phone) return;

    const phone = normalizePhone(member.phone);

    // Emojis as Unicode escapes to prevent any encoding corruption
    const party    = '\uD83C\uDF89'; // 🎉
    const fire     = '\uD83D\uDD25'; // 🔥
    const muscle   = '\uD83D\uDCAA'; // 💪
    const heart    = '\u2764\uFE0F'; // ❤️

    const message =
        `Happy Birthday ${member.name} ${party}${fire}\n\n` +
        `Wishing you strength, happiness, discipline and great health ahead.\n\n` +
        `Keep pushing, keep hustling and keep becoming the strongest version of yourself ${muscle}\n\n` +
        `Have an amazing year ahead!\n\n` +
        `Regards,\n` +
        `Team MFP Gym ${heart}`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}


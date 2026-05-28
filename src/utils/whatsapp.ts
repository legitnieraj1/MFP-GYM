export function openWhatsAppReminder(member: any) {
    if (!member || !member.phone) return;

    let phone = member.phone.trim();
    // Remove all '+' or spaces
    phone = phone.replace(/\+/g, '').replace(/\s+/g, '');

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
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}

export function openWhatsAppBirthdayWish(member: { name: string; phone: string }) {
    if (!member || !member.phone) return;

    let phone = member.phone.trim().replace(/\+/g, '').replace(/\s+/g, '');

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


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

    const message = `Happy Birthday ${member.name} 🎉🔥

Wishing you strength, happiness, discipline and great health ahead.

Keep pushing, keep hustling and keep becoming the strongest version of yourself 💪

Have an amazing year ahead!

Regards,
Team MFP Gym ❤️`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
}

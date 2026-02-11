import { useEffect, useState } from 'react';

export default function useRazorpay() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setIsLoaded(true);
        document.body.appendChild(script);
    }, []);

    return isLoaded;
}

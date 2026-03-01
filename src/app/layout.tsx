import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/providers";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "MFP Gym Periyanaickenpalayam | Best Gym in Periyanaickenpalayam | Team MFP",
    template: "%s | MFP Gym Periyanaickenpalayam",
  },
  description:
    "MFP Gym is the best gym in Periyanaickenpalayam, Coimbatore. Team MFP offers expert personal training, modern equipment, body transformation programs, AI diet plans, and affordable membership. Join the top-rated gym near Periyanaickenpalayam today!",
  keywords: [
    "best gym in periyanaickenpalayam",
    "gyms in periyanaickenpalayam",
    "team mfp",
    "mfp gym",
    "mfp gym periyanaickenpalayam",
    "mfp gym pnp",
    "gym near periyanaickenpalayam",
    "fitness center periyanaickenpalayam",
    "personal training periyanaickenpalayam",
    "body transformation coimbatore",
    "best gym coimbatore",
    "gym periyanaickenpalayam coimbatore",
    "weight loss gym periyanaickenpalayam",
    "bodybuilding gym periyanaickenpalayam",
    "affordable gym periyanaickenpalayam",
    "roman prabhur trainer",
    "mfp fitness",
    "gym near me periyanaickenpalayam",
  ],
  metadataBase: new URL("https://mfpgympnp.in"),
  alternates: {
    canonical: "https://mfpgympnp.in",
  },
  openGraph: {
    title: "MFP Gym Periyanaickenpalayam | Best Gym & Fitness Center | Team MFP",
    description:
      "Looking for the best gym in Periyanaickenpalayam? MFP Gym (Team MFP) offers expert personal training, modern equipment, body transformation programs, and AI-powered diet plans. Join now!",
    url: "https://mfpgympnp.in",
    siteName: "MFP Gym Periyanaickenpalayam",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/mfp logo.jpg",
        width: 800,
        height: 600,
        alt: "MFP Gym - Best Gym in Periyanaickenpalayam, Coimbatore",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MFP Gym Periyanaickenpalayam | Best Gym & Fitness Center",
    description:
      "Top-rated gym in Periyanaickenpalayam with expert trainers, modern equipment & personalized fitness plans. Join Team MFP today!",
    images: ["/mfp logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code here after setup
    // google: "YOUR_GOOGLE_VERIFICATION_CODE",
  },
  category: "fitness",
};

// JSON-LD Structured Data for Local Business (Gym)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GymOrHealthClub",
  name: "MFP Gym - Team MFP",
  alternateName: ["Team MFP", "MFP Gym Periyanaickenpalayam", "MFP Gym PNP", "MFP Fitness"],
  description:
    "MFP Gym is the best gym and fitness center in Periyanaickenpalayam, Coimbatore. We offer personal training, body transformation programs, AI-powered diet plans, modern gym equipment, and affordable membership plans.",
  url: "https://mfpgympnp.in",
  logo: "https://mfpgympnp.in/mfp logo.jpg",
  image: "https://mfpgympnp.in/mfp logo.jpg",
  telephone: "+918098834154",
  email: "info@mfpgym.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "No 17, Bhagat Singh Nagar",
    addressLocality: "Periyanaickenpalayam",
    addressRegion: "Tamil Nadu",
    postalCode: "641020",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 11.1551686,
    longitude: 76.9505951,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "05:00",
      closes: "23:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "06:00",
      closes: "14:00",
    },
  ],
  priceRange: "$$",
  currenciesAccepted: "INR",
  paymentAccepted: "Cash, UPI, Razorpay, Online Payment",
  areaServed: {
    "@type": "GeoCircle",
    geoMidpoint: {
      "@type": "GeoCoordinates",
      latitude: 11.1551686,
      longitude: 76.9505951,
    },
    geoRadius: "15000",
  },
  sameAs: [
    "https://www.instagram.com/mfp_pnp_/",
    "https://www.instagram.com/romanprabhur/",
  ],
  founder: {
    "@type": "Person",
    name: "Roman Prabhur",
    jobTitle: "Head Trainer & Founder",
    sameAs: "https://www.instagram.com/romanprabhur/",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Gym Membership Plans",
    itemListElement: [
      {
        "@type": "Offer",
        name: "Basic Plan",
        description: "3-month gym membership with access to all equipment",
        price: "3099",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        description: "6-month gym membership - most popular plan",
        price: "4699",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Elite Plan",
        description: "1-year gym membership - best value",
        price: "6699",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "Personal Training",
        description: "One-on-one personal training sessions per month",
        price: "5000",
        priceCurrency: "INR",
      },
      {
        "@type": "Offer",
        name: "60 Day Transformation",
        description: "Complete body transformation program with personal coaching",
        price: "9000",
        priceCurrency: "INR",
      },
    ],
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    bestRating: "5",
    worstRating: "1",
    ratingCount: "150",
  },
  review: [
    {
      "@type": "Review",
      author: { "@type": "Person", name: "MFP Gym Member" },
      reviewRating: { "@type": "Rating", ratingValue: "5", bestRating: "5" },
      reviewBody: "Best gym in Periyanaickenpalayam with modern equipment and expert trainers.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={cn(inter.variable, bebas.variable, "font-sans antialiased text-white bg-black")}>
        <Providers>
          {children}
        </Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}


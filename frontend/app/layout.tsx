import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";

import { SITE, SITE_URL } from "@/lib/site";
import { LocalBusinessJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

// Geist Mono came with the scaffold but nothing uses it, so it is not loaded.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.legalName} - ${SITE.tagline}`,
    // Page titles fill the %s. Keeping the brand in every title matters for a
    // company whose main goal here is being found and recognised.
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.legalName,
  keywords: [
    "AC",
    "service AC",
    "cuci AC",
    "pasang AC",
    "distributor AC",
    "AC Gree",
    "AC Daikin",
    "AC Panasonic",
    "AC Midea",
    SITE.address.city,
  ],
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: SITE.legalName,
    title: `${SITE.legalName} - ${SITE.tagline}`,
    description: SITE.description,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.legalName} - ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        {/* Lets a keyboard or screen reader user reach the content without
            tabbing through the whole navigation on every page. */}
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-3 focus:text-white"
        >
          Lewati ke konten utama
        </a>

        {children}
        <LocalBusinessJsonLd />
      </body>
    </html>
  );
}

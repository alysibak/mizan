import type { Metadata, Viewport } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import PwaSetup from "@/components/PwaSetup";
import Analytics from "@/components/Analytics";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, siteUrl } from "@/lib/site";

const literata = Literata({
  subsets: ["latin"],
  variable: "--font-literata",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${SITE_NAME}: zakat calculator and ledger`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "zakat calculator",
    "zakat",
    "nisab",
    "hawl",
    "sadaqah",
    "Islamic finance",
    "zakat al-fitr",
    "gold nisab",
    "silver nisab",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mizan" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F1" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1A16" },
  ],
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${literata.variable} ${sourceSans.variable}`}>
      <body>
        {children}
        <PwaSetup />
        <Analytics />
      </body>
    </html>
  );
}

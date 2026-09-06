import type { Metadata, Viewport } from "next";
import { Literata, Source_Sans_3 } from "next/font/google";
import "./globals.css";

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
  title: "Mizan: Islamic wealth, in balance",
  description:
    "Reckon your zakat against nisab, keep a ledger of what you own and give, and close the holding year with care.",
  applicationName: "Mizan",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Mizan" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0E2A22",
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
      <body>{children}</body>
    </html>
  );
}

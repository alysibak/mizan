import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mizan: Islamic wealth, in balance",
  description:
    "Calculate your zakat, track halal assets, and record your giving. Local-first, with no expiring dependencies.",
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";

const SITE_URL = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Split Shop · Plurel Pay open demo",
  description:
    "An open reference storefront on the Plurel Pay SDK in sandbox — build a cart, split with Plurel Pay, and pay with friends. No real money moves.",
  openGraph: {
    title: "Split Shop · Plurel Pay open demo",
    description:
      "Build a cart, split with Plurel Pay, and pay with friends — sandbox only, no real money moves.",
    url: SITE_URL,
    siteName: "Plurel Pay",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Split Shop · Plurel Pay open demo",
    description:
      "Build a cart, split with Plurel Pay, and pay with friends — sandbox only, no real money moves.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

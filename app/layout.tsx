import type { Metadata } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Ante brand type: Geist for everything, Instrument Serif for italic accents —
// matching splitante.com. (Mono retired from the storefront; it read as terminal
// type. The --font-mono token in globals.css now resolves to Geist.)
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ante-demo-store.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Split Shop · Ante open demo",
  description:
    "An open reference storefront on Ante's production SDK in sandbox — build a cart, tap the Ante button, and split payment with friends. No real money moves.",
  openGraph: {
    title: "Split Shop · Ante open demo",
    description:
      "Build a cart, tap the Ante button, and split payment with friends — sandbox only, no real money moves.",
    url: SITE_URL,
    siteName: "Ante",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Split Shop · Ante open demo",
    description:
      "Build a cart, tap the Ante button, and split payment with friends — sandbox only, no real money moves.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${instrumentSerif.variable} min-h-screen text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}

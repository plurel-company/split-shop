import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Ante brand type: Geist for text, Geist Mono for labels/figures,
// Instrument Serif for italic accents — matching splitante.com.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "Ante Demo Store",
  description: "Minimal storefront demo for Ante group checkout",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geist.variable} ${geistMono.variable} ${instrumentSerif.variable} min-h-screen text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { resolveSiteUrl } from "@/lib/site-url";
import "./globals.css";
import "./plurel-tokens.css";
import "./plurel-theme.css";

const SITE_URL = resolveSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "SplitShop · Checkout playground",
  description:
    "A checkout playground for developers. Build a cart, invite the group and test a shared checkout. No real money moves.",
  openGraph: {
    title: "SplitShop · Checkout playground",
    description:
      "Build a cart and test a shared checkout. Sandbox only, no real money moves.",
    url: SITE_URL,
    siteName: "SplitShop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SplitShop · Checkout playground",
    description:
      "Build a cart and test a shared checkout. Sandbox only, no real money moves.",
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

import type { Cart } from "@plurel/sdk";

import type { CurrencyCode } from "@/lib/currency";

/** Demo catalog categories — shop (physical goods) vs lodging (nightly stays). */
export type ProductCategory = "shop" | "lodging" | "tickets" | "gifts";

export type LodgingDetails = {
  beds: string;
  baths: string;
  rooms?: string;
  buildings?: string;
  sqft?: string;
  amenities: string[];
};

export type ProductFee = {
  id: string;
  label: string;
  amount: number;
  /** Per night multiplies by stay length; per stay is charged once per booking. */
  billing: "per_night" | "per_stay";
};

export type Product = {
  id: string;
  name: string;
  description: string;
  /** Price in minor units (cents for USD/EUR/GBP; whole yen for JPY). */
  unitPrice: number;
  currency: CurrencyCode;
  emoji: string;
  category: ProductCategory;
  /** Absolute HTTPS URL — Plurel Pay hosted checkout loads this cross-origin. */
  imageUrl: string;
  lodging?: LodgingDetails;
  fees?: ProductFee[];
};

/** Cart line sent to Plurel Pay (amounts in cents). */
export type CartLine = {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  image_url?: string;
};

export type CartFeeLine = {
  id: string;
  label: string;
  amount: number;
};

/** Client-side order snapshot after group.funded (from webhook poll or callback). */
export type ConfirmedOrder = {
  orderRef: string;
  groupId: string;
  currency: CurrencyCode;
  lines: CartLine[];
  fees?: CartFeeLine[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  confirmedAt: number;
  confirmedVia?: "webhook" | "sdk";
};

/** productId → quantity in the browser cart. */
export type CartState = Record<string, number>;

/** Cart payload for Plurel Pay SDK with optional product image URLs. */
export type PlurelCart = Cart & {
  items: (Cart["items"][number] & { image_url?: string })[];
};

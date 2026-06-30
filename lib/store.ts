import type { Cart, CartFee } from "@splitante/sdk";

/** Public site origin for absolute product image URLs (Ante hosted checkout). */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://ante-demo-store.vercel.app";

function productImageUrl(filename: string): string {
  return `${SITE_URL}/products/${filename}`;
}

export type ProductCategory = "shop" | "lodging";

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
  unitPrice: number;
  emoji: string;
  category: ProductCategory;
  /** Absolute HTTPS URL — Ante hosted checkout loads this cross-origin. */
  imageUrl: string;
  lodging?: LodgingDetails;
  fees?: ProductFee[];
};

/** Ante default minimum order (matches splitante.com merchant settings). */
export const MINIMUM_ORDER_CENTS = 1000;

export const PRODUCT_SECTIONS: { id: ProductCategory; title: string; subtitle: string }[] = [
  {
    id: "shop",
    title: "Shop",
    subtitle: "Physical goods with flat-rate shipping.",
  },
  {
    id: "lodging",
    title: "Stays",
    subtitle: "Hotel rooms and whole-home rentals with cleaning and resort fees.",
  },
];

/** Prices in cents (USD). Product photos live in /public/products. */
export const PRODUCTS: Product[] = [
  {
    id: "mug",
    name: "Ceramic Mug",
    description: "12 oz matte finish, dishwasher safe.",
    unitPrice: 1800,
    emoji: "☕",
    category: "shop",
    imageUrl: productImageUrl("mug.jpg"),
  },
  {
    id: "tote",
    name: "Canvas Tote",
    description: "Heavy cotton, fits a laptop.",
    unitPrice: 2400,
    emoji: "👜",
    category: "shop",
    imageUrl: productImageUrl("tote.jpg"),
  },
  {
    id: "stickers",
    name: "Sticker Pack",
    description: "Five weatherproof vinyl stickers.",
    unitPrice: 1200,
    emoji: "✨",
    category: "shop",
    imageUrl: productImageUrl("stickers.jpg"),
  },
  {
    id: "deluxe-suite",
    name: "Deluxe Penthouse Suite",
    description: "Corner suite with skyline views, lounge access, and in-room dining.",
    unitPrice: 48900,
    emoji: "🏨",
    category: "lodging",
    imageUrl: productImageUrl("deluxe-suite.jpg"),
    lodging: {
      beds: "1 king + sofa bed",
      baths: "2 full",
      rooms: "Bedroom, living room, dining nook",
      sqft: "850 sq ft",
      amenities: ["Club lounge", "Rain shower + soaking tub", "Nespresso bar", "Turndown service"],
    },
    fees: [
      { id: "resort", label: "Resort fee", amount: 7500, billing: "per_night" },
      { id: "housekeeping", label: "Deep cleaning", amount: 12000, billing: "per_stay" },
    ],
  },
  {
    id: "hotel-room",
    name: "Classic Hotel Room",
    description: "Quiet queen room on a lower floor — ideal for solo travelers or couples.",
    unitPrice: 14900,
    emoji: "🛏️",
    category: "lodging",
    imageUrl: productImageUrl("hotel-room.jpg"),
    lodging: {
      beds: "1 queen",
      baths: "1 full",
      rooms: "Studio layout",
      sqft: "280 sq ft",
      amenities: ["Desk + ergonomic chair", "Mini fridge", "Blackout shades", "Walk-in shower"],
    },
    fees: [{ id: "resort", label: "Resort fee", amount: 3500, billing: "per_night" }],
  },
  {
    id: "compound-house",
    name: "Cedar Compound Retreat",
    description: "Airbnb-style estate — main lodge plus two guest cottages on five acres.",
    unitPrice: 185000,
    emoji: "🏡",
    category: "lodging",
    imageUrl: productImageUrl("compound-house.jpg"),
    lodging: {
      beds: "5 bedrooms (8 beds total)",
      baths: "4 full",
      buildings: "Main house + 2 guest cottages",
      rooms: "Great room, chef's kitchen, game loft",
      sqft: "4,200 sq ft across 3 buildings",
      amenities: ["Hot tub", "Fire pit", "EV charger", "Sleeps 12", "Mountain views"],
    },
    fees: [
      { id: "cleaning", label: "Cleaning fee", amount: 35000, billing: "per_stay" },
      { id: "service", label: "Platform service fee", amount: 18000, billing: "per_stay" },
      { id: "waiver", label: "Damage waiver", amount: 9500, billing: "per_stay" },
    ],
  },
];

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

export type ConfirmedOrder = {
  orderRef: string;
  groupId: string;
  lines: CartLine[];
  fees?: CartFeeLine[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  confirmedAt: number;
  confirmedVia?: "webhook";
};

export type CartState = Record<string, number>;

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

export function productsInCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((product) => product.category === category);
}

export function buildProductCartLines(cart: CartState): CartLine[] {
  return PRODUCTS.filter((product) => (cart[product.id] ?? 0) > 0).map((product) => ({
    id: product.id,
    name: product.name,
    quantity: cart[product.id],
    unit_price: product.unitPrice,
    image_url: product.imageUrl,
  }));
}

export function buildCartFees(cart: CartState): CartFee[] {
  const fees: CartFee[] = [];

  for (const product of PRODUCTS) {
    const nights = cart[product.id] ?? 0;
    if (nights === 0 || !product.fees?.length) continue;

    for (const fee of product.fees) {
      const amount = fee.billing === "per_night" ? fee.amount * nights : fee.amount;
      fees.push({
        id: `${product.id}-${fee.id}`,
        label: fee.label,
        amount,
      });
    }
  }

  return fees.sort((a, b) => a.id.localeCompare(b.id));
}

export function buildCartLines(cart: CartState): CartLine[] {
  return buildProductCartLines(cart);
}

export function buildCartFeeSummary(cart: CartState): CartFeeLine[] {
  return buildCartFees(cart).map((fee) => ({
    id: fee.id,
    label: fee.label,
    amount: fee.amount,
  }));
}

export type AnteCart = Cart & {
  items: (Cart["items"][number] & { image_url?: string })[];
};

export function cartSubtotal(cart: CartState): number {
  return buildProductCartLines(cart).reduce(
    (sum, line) => sum + line.quantity * line.unit_price,
    0,
  );
}

export function cartFeesTotal(cart: CartState): number {
  return buildCartFeeSummary(cart).reduce((sum, fee) => sum + fee.amount, 0);
}

function cartHasShopItems(cart: CartState): boolean {
  return PRODUCTS.some(
    (product) => product.category === "shop" && (cart[product.id] ?? 0) > 0,
  );
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function makeOrderRef(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export function buildAnteCart(cart: CartState, orderRef: string): AnteCart {
  const items = buildProductCartLines(cart);
  const fees = buildCartFees(cart);
  const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const merchandiseSubtotal = cartSubtotal(cart);
  const tax = Math.round(merchandiseSubtotal * 0.08);
  const shipping = cartHasShopItems(cart) ? 500 : 0;

  return {
    total: merchandiseSubtotal + tax + shipping + feesTotal,
    currency: "usd",
    items,
    tax,
    shipping,
    ...(fees.length > 0 ? { fees } : {}),
    metadata: { order_ref: orderRef },
  };
}

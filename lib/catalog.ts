import type { CurrencyCode } from "@/lib/currency";
import { CURRENCY_ORDER, convertFromUsd, getMinimumOrderMinor } from "@/lib/currency";
import type { Product, ProductCategory } from "@/lib/types";

/** Public site origin for absolute product image URLs (Plurel Pay hosted checkout). */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://splitshop.dev";

function productImageUrl(filename: string): string {
  return `${SITE_URL}/products/${filename}`;
}

/** Stable Unsplash hotlinks (same pattern as the plurelpay.com catalog seed) —
 *  real photography is what makes the demo read as a real store. */
function unsplash(id: string): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=72`;
}

/** Pexels CDN hotlinks — used where the Unsplash seed ids didn't match the product. */
function pexels(id: string): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1000`;
}

/** Plurel Pay default minimum order for USD (matches plurelpay.com merchant settings). */
export const MINIMUM_ORDER_CENTS = getMinimumOrderMinor("USD");

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
  {
    id: "tickets",
    title: "Event tickets",
    subtitle: "Concerts and festivals — everyone covers their own seat.",
  },
  {
    id: "gifts",
    title: "Group gifts",
    subtitle: "Pool the group toward one big gift — split it any way you like.",
  },
];

/** Prices in minor units per currency. Product photos live in /public/products. */
export const PRODUCTS: Product[] = [
  {
    id: "groceries",
    name: "Weekly Grocery Haul",
    description: "A week of fresh produce and pantry staples — split the house order.",
    unitPrice: 9600,
    currency: "USD",
    emoji: "🛒",
    category: "shop",
    imageUrl: pexels("4020557"),
  },
  {
    id: "air-purifier",
    name: "Air Purifier",
    description: "True HEPA tower, three speeds, quiet night mode.",
    unitPrice: 21900,
    currency: "USD",
    emoji: "🌀",
    category: "shop",
    imageUrl: pexels("6857201"),
  },
  {
    id: "robot-vacuum",
    name: "Robot Vacuum",
    description: "Self-charging and app-scheduled — the classic roommate split.",
    unitPrice: 34900,
    currency: "USD",
    emoji: "🤖",
    category: "shop",
    imageUrl: pexels("844874"),
  },
  {
    id: "deluxe-suite",
    name: "Deluxe Penthouse Suite",
    description: "Corner suite with skyline views, lounge access, and in-room dining.",
    unitPrice: 48900,
    currency: "USD",
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
    unitPrice: 15900,
    currency: "USD",
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
    unitPrice: 189000,
    currency: "USD",
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
      { id: "cleaning", label: "Cleaning fee", amount: 24000, billing: "per_stay" },
      { id: "service", label: "Platform service fee", amount: 12000, billing: "per_stay" },
      { id: "waiver", label: "Damage waiver", amount: 6500, billing: "per_stay" },
    ],
  },
  {
    id: "concert-tickets",
    name: "Arena Concert — 4 Tickets",
    description: "Section 112, four seats together. Saturday night.",
    unitPrice: 36000,
    currency: "USD",
    emoji: "🎫",
    category: "tickets",
    imageUrl: unsplash("1470229722913-7c0e2dbbafd3"),
  },
  {
    id: "festival-passes",
    name: "Festival Weekend — 2 Passes",
    description: "GA weekend passes, both days, all stages.",
    unitPrice: 45800,
    currency: "USD",
    emoji: "🎪",
    category: "tickets",
    imageUrl: unsplash("1501281668745-f7f57925c3b4"),
  },
  {
    id: "spa-package",
    name: "Spa Day Package (group gift)",
    description: "A full day of treatments — pool up and send them off.",
    unitPrice: 45000,
    currency: "USD",
    emoji: "🧖",
    category: "gifts",
    imageUrl: pexels("33852650"),
  },
  {
    id: "espresso-machine",
    name: "Espresso Machine (group gift)",
    description: "The group gift for the friend who has everything.",
    unitPrice: 64900,
    currency: "USD",
    emoji: "☕",
    category: "gifts",
    imageUrl: pexels("2775827"),
  },
  {
    id: "turntable",
    name: "Vinyl Turntable (group gift)",
    description: "For the vinyl nerd — a proper deck, split the tab.",
    unitPrice: 39900,
    currency: "USD",
    emoji: "🎶",
    category: "gifts",
    imageUrl: pexels("3916058"),
  },
];

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((product) => product.id === id);
}

/** A product re-priced into the selected display currency (base prices are USD). */
export function productInCurrency(product: Product, currency: CurrencyCode): Product {
  if (currency === "USD") return product;
  return {
    ...product,
    currency,
    unitPrice: convertFromUsd(product.unitPrice, currency),
    fees: product.fees?.map((fee) => ({
      ...fee,
      amount: convertFromUsd(fee.amount, currency),
    })),
  };
}

export function catalogInCurrency(currency: CurrencyCode): Product[] {
  return PRODUCTS.map((product) => productInCurrency(product, currency));
}

export function productsInCategory(category: ProductCategory): Product[] {
  return PRODUCTS.filter((product) => product.category === category);
}

/** Products in a category grouped by currency (stable order). */
export function productsByCurrencyInCategory(
  category: ProductCategory,
): { currency: CurrencyCode; products: Product[] }[] {
  const inCategory = productsInCategory(category);
  return CURRENCY_ORDER.filter((currency) =>
    inCategory.some((product) => product.currency === currency),
  ).map((currency) => ({
    currency,
    products: inCategory.filter((product) => product.currency === currency),
  }));
}

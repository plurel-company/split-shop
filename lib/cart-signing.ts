import { createHmac, timingSafeEqual } from "node:crypto";

import type { Cart } from "@splitante/sdk";

function sortObjectKeys<T extends Record<string, string>>(obj: T): T {
  const sorted = Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = obj[key]!;
      return acc;
    }, {});
  return sorted as T;
}

/** Must match splitante.com server canonicalization exactly. */
export function canonicalizeCart(cart: Cart): string {
  const normalized = {
    total: cart.total,
    currency: cart.currency.toLowerCase(),
    items: [...cart.items]
      .map((item) => ({
        id: item.id ?? "",
        name: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }))
      .sort((a, b) => (a.id ?? "").localeCompare(b.id ?? "")),
    tax: cart.tax ?? 0,
    shipping: cart.shipping ?? 0,
    ...(cart.metadata ? { metadata: sortObjectKeys(cart.metadata) } : {}),
  };

  return JSON.stringify(normalized);
}

export function createCartSignature(cart: Cart, secret: string): string {
  const trimmed = secret.trim();
  if (!trimmed) {
    throw new Error("Signing secret is empty");
  }
  return createHmac("sha256", trimmed).update(canonicalizeCart(cart), "utf8").digest("hex");
}

export function verifyCartSignature(cart: Cart, secret: string, signature: string): boolean {
  if (!secret.trim() || !signature.trim()) return false;
  const expected = createCartSignature(cart, secret);
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature.trim(), "hex"));
  } catch {
    return false;
  }
}

import type { CartFee } from "@splitante/sdk";

import { catalogInCurrency, PRODUCTS } from "@/lib/catalog";
import {
  anteCurrencyCode,
  CURRENCY_META,
  type CurrencyCode,
  getMinimumOrderMinor,
} from "@/lib/currency";
import type { AnteCart, CartFeeLine, CartLine, CartState } from "@/lib/types";

export function getCartCurrency(cart: CartState): CurrencyCode | null {
  for (const product of PRODUCTS) {
    if ((cart[product.id] ?? 0) > 0) {
      return product.currency;
    }
  }
  return null;
}

export function wouldMixCartCurrency(cart: CartState, productId: string): boolean {
  const product = PRODUCTS.find((entry) => entry.id === productId);
  const cartCurrency = getCartCurrency(cart);
  if (!product || !cartCurrency) return false;
  return product.currency !== cartCurrency;
}

export function buildProductCartLines(cart: CartState, currency: CurrencyCode = "USD"): CartLine[] {
  return catalogInCurrency(currency)
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({
    id: product.id,
    name: product.name,
    quantity: cart[product.id],
    unit_price: product.unitPrice,
    image_url: product.imageUrl,
  }));
}

export function buildCartFees(cart: CartState, currency: CurrencyCode = "USD"): CartFee[] {
  const fees: CartFee[] = [];

  for (const product of catalogInCurrency(currency)) {
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

export function buildCartFeeSummary(cart: CartState, currency: CurrencyCode = "USD"): CartFeeLine[] {
  return buildCartFees(cart, currency).map((fee) => ({
    id: fee.id,
    label: fee.label,
    amount: fee.amount,
  }));
}

export function cartSubtotal(cart: CartState, currency: CurrencyCode = "USD"): number {
  return buildProductCartLines(cart, currency).reduce(
    (sum, line) => sum + line.quantity * line.unit_price,
    0,
  );
}

export function cartFeesTotal(cart: CartState, currency: CurrencyCode = "USD"): number {
  return buildCartFeeSummary(cart, currency).reduce((sum, fee) => sum + fee.amount, 0);
}

function cartHasShopItems(cart: CartState): boolean {
  return PRODUCTS.some(
    (product) => product.category === "shop" && (cart[product.id] ?? 0) > 0,
  );
}

export function makeOrderRef(): string {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

/** Build the signed cart payload for Ante checkout (tax/shipping are demo approximations). */
export function buildAnteCart(
  cart: CartState,
  orderRef: string,
  currency: CurrencyCode = "USD",
): AnteCart | null {
  if (!Object.values(cart).some((qty) => qty > 0)) return null;

  const items = buildProductCartLines(cart, currency);
  const fees = buildCartFees(cart, currency);
  const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const merchandiseSubtotal = cartSubtotal(cart, currency);
  const tax = Math.round(merchandiseSubtotal * 0.08);
  const shipping = cartHasShopItems(cart) ? CURRENCY_META[currency].shopShippingMinor : 0;

  return {
    total: merchandiseSubtotal + tax + shipping + feesTotal,
    currency: anteCurrencyCode(currency),
    items,
    tax,
    shipping,
    ...(fees.length > 0 ? { fees } : {}),
    metadata: { order_ref: orderRef },
  };
}

export function cartMeetsMinimum(cart: CartState, currency: CurrencyCode = "USD"): boolean {
  const anteCart = buildAnteCart(cart, "preview", currency);
  if (!anteCart) return true;
  return anteCart.total >= getMinimumOrderMinor(currency);
}

export function minimumOrderForCart(currency: CurrencyCode = "USD"): number {
  return getMinimumOrderMinor(currency);
}

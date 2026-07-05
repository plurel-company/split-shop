"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useEffect } from "react";

import {
  cartSubtotal,
  CURRENCY_ORDER,
  getProduct,
  type CartState,
  type CurrencyCode,
} from "@/lib/store";

const CURRENCY_STORAGE_KEY = "ante-demo-currency";

type CartContextValue = {
  cart: CartState;
  itemCount: number;
  subtotal: number;
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  notice: string | null;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  dismissNotice: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartState>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [currency, setCurrencyState] = useState<CurrencyCode>("USD");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null;
      if (stored && CURRENCY_ORDER.includes(stored)) setCurrencyState(stored);
    } catch {
      /* ignore */
    }
  }, []);

  const setCurrency = useCallback((next: CurrencyCode) => {
    if (!CURRENCY_ORDER.includes(next)) return;
    setCurrencyState((prev) => {
      if (next === prev) return prev;
      setCart((current) => {
        if (Object.values(current).some((qty) => qty > 0)) {
          setNotice(`Prices switched to ${next} — your cart was cleared.`);
          return {};
        }
        return current;
      });
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const addItem = useCallback((productId: string) => {
    const product = getProduct(productId);
    if (!product) return;

    setCart((current) => {
      setNotice(null);
      return {
        ...current,
        [productId]: (current[productId] ?? 0) + 1,
      };
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[productId] ?? 0) - 1;
      if (quantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = quantity;
      }
      return next;
    });
    setNotice(null);
  }, []);

  const clearCart = useCallback(() => {
    setCart({});
    setNotice(null);
  }, []);

  const value = useMemo(() => {
    // Count distinct products (line-items), not total units — a cart with
    // 2 products (one qty 3) reads "2 items", with per-line qty shown per row.
    const itemCount = Object.values(cart).filter((qty) => qty > 0).length;
    return {
      cart,
      itemCount,
      subtotal: cartSubtotal(cart, currency),
      currency,
      setCurrency,
      notice,
      addItem,
      removeItem,
      clearCart,
      dismissNotice,
    };
  }, [addItem, cart, clearCart, currency, dismissNotice, notice, removeItem, setCurrency]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

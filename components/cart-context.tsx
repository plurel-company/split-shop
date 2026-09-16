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

const CURRENCY_STORAGE_KEY = "plurel-demo-currency";

type Scenario = { id: string; cart: CartState; people: number };

type CartContextValue = {
  people: number;
  setPeople: (people: number) => void;
  scenario: string | null;
  resetRevision: number;
  loadScenario: (scenario: Scenario) => void;
  resetDemo: () => void;
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
  const [people, setPeople] = useState(4);
  const [scenario, setScenario] = useState<string | null>(null);
  const [resetRevision, setResetRevision] = useState(0);
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
    if (!CURRENCY_ORDER.includes(next) || next === currency) return;
    setCurrencyState(next);
    if (Object.values(cart).some(quantity => quantity > 0)) {
      setNotice(`Prices switched to ${next}. Your cart was cleared.`);
      setCart({});
    }
    setScenario(null);
    setResetRevision(revision => revision + 1);
    try { localStorage.setItem(CURRENCY_STORAGE_KEY, next); } catch { /* Storage can be disabled. */ }
  }, [currency, cart]);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const addItem = useCallback((productId: string) => {
    const product = getProduct(productId);
    if (!product) return;

    setScenario(null);
    setNotice(null);
    setCart((current) => {
      return {
        ...current,
        [productId]: (current[productId] ?? 0) + 1,
      };
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setScenario(null);
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

  const loadScenario = useCallback((value: Scenario) => {
    setCart(value.cart); setPeople(value.people); setScenario(value.id); setNotice(null); setResetRevision(revision => revision + 1);
  }, []);
  const resetDemo = useCallback(() => {
    setCart({}); setPeople(4); setScenario(null); setNotice(null); setResetRevision(revision => revision + 1);
  }, []);

  const value = useMemo(() => {
    // Count distinct products (line-items), not total units — a cart with
    // 2 products (one qty 3) reads "2 items", with per-line qty shown per row.
    const itemCount = Object.values(cart).filter((qty) => qty > 0).length;
    return {
      people, setPeople, scenario, resetRevision, loadScenario, resetDemo,
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
  }, [people, scenario, resetRevision, loadScenario, resetDemo, addItem, cart, clearCart, currency, dismissNotice, notice, removeItem, setCurrency]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

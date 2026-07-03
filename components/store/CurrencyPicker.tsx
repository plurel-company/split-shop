"use client";

import { useCart } from "@/components/cart-context";
import { CURRENCY_ORDER, type CurrencyCode } from "@/lib/store";

/** Header currency switcher — demo FX re-prices the whole catalog. */
export function CurrencyPicker() {
  const { currency, setCurrency } = useCart();

  return (
    <label className="currency-picker">
      <span className="sr-only">Display currency</span>
      <select
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        aria-label="Display currency"
      >
        {CURRENCY_ORDER.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
      <span className="currency-picker__chevron" aria-hidden>
        ▾
      </span>
    </label>
  );
}

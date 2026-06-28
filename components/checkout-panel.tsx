"use client";

import { AnteButton, type Cart } from "@splitante/react-sdk";
import { useMemo, useState } from "react";

import { useCart } from "@/components/cart-context";
import { explainAnteApiError } from "@/lib/ante-env";
import { buildAnteCart, formatUsd, makeOrderRef } from "@/lib/store";

function checkoutErrorMessage(error: Error): string {
  return explainAnteApiError(error.message);
}

export function CheckoutPanel() {
  const { cart, itemCount, subtotal, clearCart } = useCart();
  const [orderRef] = useState(makeOrderRef);
  const [status, setStatus] = useState<string | null>(null);

  const anteCart = useMemo(() => buildAnteCart(cart, orderRef), [cart, orderRef]);
  const tax = anteCart.tax ?? 0;
  const shipping = anteCart.shipping ?? 0;
  const total = anteCart.total;

  async function signCart(cartToSign: Cart) {
    const response = await fetch("/api/cart/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart: cartToSign }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Cart signing failed");
    }

    const { signature } = (await response.json()) as { signature: string };
    return signature;
  }

  if (itemCount === 0) {
    return (
      <aside className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-500">
        Add items to your cart to checkout with Ante group pay.
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">Cart</h2>
      <p className="mt-1 text-sm text-stone-500">Order {orderRef}</p>

      <dl className="mt-5 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-stone-500">Subtotal</dt>
          <dd>{formatUsd(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone-500">Tax (8%)</dt>
          <dd>{formatUsd(tax)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone-500">Shipping</dt>
          <dd>{formatUsd(shipping)}</dd>
        </div>
        <div className="flex justify-between border-t border-stone-100 pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatUsd(total)}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <AnteButton
          getSignature={signCart}
          cart={anteCart}
          group={{ minSize: 2, maxSize: 6, defaultMode: "equal" }}
          label="Pay with Ante"
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          callbacks={{
            onGroupCreated: (groupId) => {
              setStatus(`Group created · ${groupId}`);
            },
            onGroupFunded: (groupId, ref) => {
              setStatus(`Group funded · ${groupId} — fulfill order ${ref ?? orderRef}`);
              clearCart();
            },
            onError: (error) => {
              setStatus(checkoutErrorMessage(error));
            },
          }}
        />
      </div>

      {status ? <p className="mt-4 text-sm text-stone-600">{status}</p> : null}

      <p className="mt-4 text-xs leading-relaxed text-stone-400">
        Use card 4242 4242 4242 4242 in test mode, or a real card in live mode. Fulfillment
        should rely on the <code className="rounded bg-stone-100 px-1">group.funded</code>{" "}
        webhook, not this callback alone.
      </p>
    </aside>
  );
}

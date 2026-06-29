"use client";

import { AnteButton, type Cart } from "@splitante/react-sdk";
import { useCallback, useMemo, useState } from "react";

import { useCart } from "@/components/cart-context";
import { useAnteMode } from "@/components/ante-mode-provider";
import { OrderConfirmation } from "@/components/order-confirmation";
import { useOrderFundingPoll } from "@/hooks/use-order-funding-poll";
import { explainAnteApiError } from "@/lib/ante-env";
import type { FundedOrder } from "@/lib/order-store";
import {
  buildAnteCart,
  buildCartFeeSummary,
  formatUsd,
  makeOrderRef,
  MINIMUM_ORDER_CENTS,
  type ConfirmedOrder,
} from "@/lib/store";

function checkoutErrorMessage(error: Error): string {
  return explainAnteApiError(error.message);
}

function fundedOrderToConfirmed(order: FundedOrder): ConfirmedOrder {
  return {
    orderRef: order.orderRef,
    groupId: order.groupId,
    lines: order.lines,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.totalPaid,
    confirmedAt: order.fundedAt,
    confirmedVia: "webhook",
  };
}

export function CheckoutPanel() {
  const { cart, itemCount, subtotal, clearCart } = useCart();
  const { modeHeaders, mode } = useAnteMode();
  const [orderRef, setOrderRef] = useState(makeOrderRef);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [pollingOrderRef, setPollingOrderRef] = useState<string | null>(null);

  const anteCart = useMemo(() => buildAnteCart(cart, orderRef), [cart, orderRef]);
  const feeLines = useMemo(() => buildCartFeeSummary(cart), [cart]);
  const tax = anteCart.tax ?? 0;
  const shipping = anteCart.shipping ?? 0;
  const total = anteCart.total;
  const belowMinimum = total > 0 && total < MINIMUM_ORDER_CENTS;

  const handleWebhookFunded = useCallback(
    (order: FundedOrder) => {
      setConfirmedOrder(fundedOrderToConfirmed(order));
      setPollingOrderRef(null);
      clearCart();
      setStatus(null);
    },
    [clearCart],
  );

  useOrderFundingPoll({
    orderRef: pollingOrderRef,
    enabled: pollingOrderRef !== null && confirmedOrder === null,
    onFunded: handleWebhookFunded,
    onError: (message) => setStatus(message),
  });

  async function signCart(cartToSign: Cart) {
    const response = await fetch("/api/cart/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...modeHeaders },
      body: JSON.stringify({ cart: cartToSign }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(body?.error ?? "Cart signing failed");
    }

    const { signature } = (await response.json()) as { signature: string };
    return signature;
  }

  function handleContinueShopping() {
    setConfirmedOrder(null);
    setPollingOrderRef(null);
    setOrderRef(makeOrderRef());
    setStatus(null);
  }

  if (confirmedOrder) {
    return (
      <OrderConfirmation order={confirmedOrder} onContinueShopping={handleContinueShopping} />
    );
  }

  if (itemCount === 0 && !pollingOrderRef) {
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
        {feeLines.map((fee) => (
          <div key={fee.id} className="flex justify-between">
            <dt className="text-stone-500">{fee.label}</dt>
            <dd>{formatUsd(fee.amount)}</dd>
          </div>
        ))}
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
        {belowMinimum ? (
          <p className="mb-3 text-sm text-amber-800">
            Minimum order is {formatUsd(MINIMUM_ORDER_CENTS)} — add more items (current total{" "}
            {formatUsd(total)}).
          </p>
        ) : null}
        <AnteButton
          getSignature={signCart}
          cart={anteCart}
          group={{ minSize: 2, maxSize: 6, defaultMode: "equal" }}
          label="Pay with Ante"
          disabled={belowMinimum || pollingOrderRef !== null}
          className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          callbacks={{
            onGroupCreated: () => {
              setPollingOrderRef(orderRef);
              setStatus("Waiting for group.funded webhook to confirm your order…");
            },
            onError: (error) => {
              setPollingOrderRef(null);
              setStatus(checkoutErrorMessage(error));
            },
          }}
        />
      </div>

      {status ? <p className="mt-4 text-sm text-stone-600">{status}</p> : null}

      <p className="mt-4 text-xs leading-relaxed text-stone-400">
        Checkout uses <strong>{mode === "live" ? "live" : "test"}</strong> Ante keys. Order confirmation
        appears after Ante sends <code className="rounded bg-stone-100 px-1">group.funded</code> to{" "}
        <code className="rounded bg-stone-100 px-1">/api/webhooks/ante</code>.
      </p>
    </aside>
  );
}

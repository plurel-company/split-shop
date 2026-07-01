"use client";

import { AnteButton, type Cart } from "@splitante/react-sdk";
import { useCallback, useMemo, useState } from "react";

import { useCart } from "@/components/cart-context";
import { useAnteMode } from "@/components/ante-mode-provider";
import { OrderConfirmation } from "@/components/order-confirmation";
import { useOrderFundingPoll } from "@/hooks/use-order-funding-poll";
import { explainAnteApiError } from "@/lib/ante-env";
import type { FundedOrder } from "@/lib/order-store";
import { formatUsd } from "@/components/ui/format-usd";
import {
  buildAnteCart,
  buildCartFeeSummary,
  buildProductCartLines,
  cartSubtotal,
  getProduct,
  makeOrderRef,
  MINIMUM_ORDER_CENTS,
  type ConfirmedOrder,
} from "@/lib/store";
import { fetchFundedOrder } from "@/hooks/use-order-funding-poll";

function checkoutErrorMessage(error: Error): string {
  return explainAnteApiError(error.message);
}

function fundedOrderToConfirmed(order: FundedOrder): ConfirmedOrder {
  return {
    orderRef: order.orderRef,
    groupId: order.groupId,
    lines: order.lines,
    fees: order.fees,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.totalPaid,
    confirmedAt: order.fundedAt,
    confirmedVia: "webhook",
  };
}

function isWaitingStatus(status: string | null): boolean {
  if (!status) return false;
  const lower = status.toLowerCase();
  return lower.includes("waiting") || lower.includes("confirming");
}

function isErrorStatus(status: string | null): boolean {
  if (!status) return false;
  return !isWaitingStatus(status);
}

export function CheckoutPanel() {
  const { cart, itemCount, subtotal, clearCart } = useCart();
  const { modeHeaders, mode } = useAnteMode();
  const [orderRef, setOrderRef] = useState(makeOrderRef);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [pollingOrderRef, setPollingOrderRef] = useState<string | null>(null);

  const cartLines = useMemo(() => buildProductCartLines(cart), [cart]);
  const anteCart = useMemo(() => buildAnteCart(cart, orderRef), [cart, orderRef]);
  const feeLines = useMemo(() => buildCartFeeSummary(cart), [cart]);
  const tax = anteCart.tax ?? 0;
  const shipping = anteCart.shipping ?? 0;
  const total = anteCart.total;
  const belowMinimum = total > 0 && total < MINIMUM_ORDER_CENTS;
  const isWaiting = pollingOrderRef !== null || isWaitingStatus(status);

  const handleWebhookFunded = useCallback(
    (order: FundedOrder) => {
      setConfirmedOrder(fundedOrderToConfirmed(order));
      setPollingOrderRef(null);
      clearCart();
      setStatus(null);
    },
    [clearCart],
  );

  const resetCheckoutWait = useCallback(() => {
    setPollingOrderRef(null);
    setStatus(null);
  }, []);

  const confirmFromSdk = useCallback(
    (ref: string, sessionId: string) => {
      const feeSummary = buildCartFeeSummary(cart);
      setConfirmedOrder({
        orderRef: ref,
        groupId: sessionId,
        lines: buildProductCartLines(cart),
        fees: feeSummary.length > 0 ? feeSummary : undefined,
        subtotal: cartSubtotal(cart),
        tax: anteCart.tax ?? 0,
        shipping: anteCart.shipping ?? 0,
        total: anteCart.total,
        confirmedAt: Date.now(),
        confirmedVia: "sdk",
      });
      setPollingOrderRef(null);
      clearCart();
      setStatus(null);
    },
    [anteCart.shipping, anteCart.tax, anteCart.total, cart, clearCart],
  );

  const waitForWebhookConfirmation = useCallback(
    async (ref: string, sessionId: string) => {
      setPollingOrderRef(ref);
      setStatus("Payment complete — confirming your order…");

      for (let attempt = 0; attempt < 15; attempt += 1) {
        const funded = await fetchFundedOrder(ref);
        if (funded) {
          handleWebhookFunded(funded);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      confirmFromSdk(ref, sessionId);
    },
    [confirmFromSdk, handleWebhookFunded],
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
      <aside
        className="checkout-panel checkout-panel--empty checkout-panel--sticky p-6"
        aria-label="Shopping cart"
      >
        <div className="flex flex-col items-center text-center">
          <span
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl"
            aria-hidden
          >
            🛒
          </span>
          <h2 className="text-base font-semibold text-stone-800">Your cart is empty</h2>
          <p className="mt-1.5 max-w-[14rem] text-sm leading-relaxed text-stone-500">
            Add items from the catalog, then split the total with Ante group pay.
          </p>
        </div>
      </aside>
    );
  }

  const statusClass = isWaiting
    ? "checkout-status checkout-status--waiting"
    : isErrorStatus(status)
      ? "checkout-status checkout-status--error"
      : "checkout-status";

  return (
    <aside
      className={`checkout-panel checkout-panel--sticky p-6 ${isWaiting ? "checkout-panel--waiting" : ""}`}
      aria-label="Shopping cart"
      aria-busy={isWaiting}
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-stone-900">Your cart</h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
            <span className="font-mono text-stone-600">{orderRef}</span>
          </p>
        </div>
        {isWaiting ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
            <span className="checkout-spinner" aria-hidden />
            Confirming
          </span>
        ) : null}
      </header>

      <ul className="mt-4" aria-label="Cart items">
        {cartLines.map((line) => {
          const product = getProduct(line.id);
          return (
            <li key={line.id} className="checkout-line-item">
              {line.image_url ? (
                <img src={line.image_url} alt="" className="checkout-line-thumb" />
              ) : (
                <span className="checkout-line-thumb checkout-line-thumb--placeholder" aria-hidden>
                  {product?.emoji ?? "📦"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{line.name}</p>
                <p className="text-xs text-stone-500">
                  {formatUsd(line.unit_price)} × {line.quantity}
                </p>
              </div>
              <span className="shrink-0 text-sm font-medium text-stone-800">
                {formatUsd(line.quantity * line.unit_price)}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="checkout-totals" aria-label="Order summary">
        <div className="checkout-total-row">
          <dt className="text-stone-500">Subtotal</dt>
          <dd className="text-stone-800">{formatUsd(subtotal)}</dd>
        </div>
        {feeLines.map((fee) => (
          <div key={fee.id} className="checkout-total-row">
            <dt className="text-stone-500">{fee.label}</dt>
            <dd className="text-stone-800">{formatUsd(fee.amount)}</dd>
          </div>
        ))}
        <div className="checkout-total-row">
          <dt className="text-stone-500">Tax (8%)</dt>
          <dd className="text-stone-800">{formatUsd(tax)}</dd>
        </div>
        <div className="checkout-total-row">
          <dt className="text-stone-500">Shipping</dt>
          <dd className="text-stone-800">{formatUsd(shipping)}</dd>
        </div>
        <div className="checkout-total-row checkout-total-row--grand">
          <dt>Total</dt>
          <dd>{formatUsd(total)}</dd>
        </div>
      </dl>

      {belowMinimum ? (
        <div className="checkout-minimum-warning mt-4" role="status">
          <span aria-hidden>⚠️</span>
          <p>
            Minimum order is <strong>{formatUsd(MINIMUM_ORDER_CENTS)}</strong>. Add more items —
            current total is {formatUsd(total)}.
          </p>
        </div>
      ) : null}

      <div className="checkout-ante-button-wrap">
        <AnteButton
          getSignature={signCart}
          cart={anteCart}
          group={{ minSize: 2, maxSize: 6, defaultMode: "equal" }}
          disabled={belowMinimum || pollingOrderRef !== null}
          appearance={{ fullWidth: true, size: "lg" }}
          className="!rounded-xl"
          callbacks={{
            onGroupCreated: () => {
              setPollingOrderRef(orderRef);
              setStatus("Waiting for group.funded webhook to confirm your order…");
            },
            onGroupFunded: (sessionId, fundedOrderRef) => {
              void waitForWebhookConfirmation(fundedOrderRef ?? orderRef, sessionId);
            },
            onGroupCancelled: () => {
              resetCheckoutWait();
            },
            onGroupExpired: () => {
              resetCheckoutWait();
            },
            onError: (error) => {
              resetCheckoutWait();
              setStatus(checkoutErrorMessage(error));
            },
          }}
        />
      </div>

      {status ? (
        <div className={statusClass} role="status" aria-live="polite">
          {isWaiting ? <span className="checkout-spinner" aria-hidden /> : null}
          <p className="whitespace-pre-line">{status}</p>
        </div>
      ) : null}

      <p className="checkout-footnote">
        Checkout uses <strong>{mode === "live" ? "live" : "test"}</strong> Ante keys. Order
        confirmation appears after Ante sends <code>group.funded</code> to{" "}
        <code>/api/webhooks/ante</code>.
      </p>
    </aside>
  );
}

"use client";

import { AnteButton, type Cart } from "@splitante/react-sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useCart } from "@/components/cart-context";
import { useAnteMode } from "@/components/ante-mode-provider";
import { CurrencyBadge } from "@/components/store/CurrencyBadge";
import { OrderConfirmation } from "@/components/order-confirmation";
import { useOrderFundingPoll } from "@/hooks/use-order-funding-poll";
import { explainAnteApiError } from "@/lib/ante-env";
import type { FundedOrder } from "@/lib/order-store";
import { formatMoney } from "@/components/ui/format-money";
import {
  buildAnteCart,
  buildCartFeeSummary,
  buildProductCartLines,
  cartMeetsMinimum,
  cartSubtotal,
  getProduct,
  makeOrderRef,
  minimumOrderForCart,
  type ConfirmedOrder,
  type CurrencyCode,
} from "@/lib/store";
import { fetchFundedOrder } from "@/hooks/use-order-funding-poll";

function checkoutErrorMessage(error: Error): string {
  return explainAnteApiError(error.message);
}

/** Temporary: ship the on-device failure detail to our own backend (same-origin,
 *  reachable even when cross-origin calls fail) so mobile errors are debuggable. */
function reportClientError(stage: string, error: Error) {
  try {
    void fetch("/api/client-log", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        name: error.name,
        message: String(error.message).slice(0, 500),
        ua: typeof navigator !== "undefined" ? navigator.userAgent : "?",
        href: typeof location !== "undefined" ? location.href : "?",
        online: typeof navigator !== "undefined" ? navigator.onLine : null,
        ts: new Date().toISOString(),
      }),
    });
  } catch {
    /* never let telemetry break checkout */
  }
}

function fundedOrderToConfirmed(order: FundedOrder, currency: CurrencyCode): ConfirmedOrder {
  return {
    orderRef: order.orderRef,
    groupId: order.groupId,
    currency,
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
  const { cart, itemCount, subtotal, currency, clearCart } = useCart();
  const { modeHeaders, mode, apiFallback, enableApiFallback } = useAnteMode();
  const [orderRef, setOrderRef] = useState(makeOrderRef);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [pollingOrderRef, setPollingOrderRef] = useState<string | null>(null);
  const anteButtonWrapRef = useRef<HTMLDivElement | null>(null);
  const [autoRetry, setAutoRetry] = useState(false);

  // After a network failure flips the SDK to the backup route, the provider
  // remounts — re-fire the checkout automatically so one tap is enough.
  useEffect(() => {
    if (!autoRetry || !apiFallback) return;
    setAutoRetry(false);
    const timer = setTimeout(() => {
      anteButtonWrapRef.current?.querySelector("button")?.click();
    }, 500);
    return () => clearTimeout(timer);
  }, [autoRetry, apiFallback]);

  const cartLines = useMemo(() => buildProductCartLines(cart, currency), [cart, currency]);
  const anteCart = useMemo(() => buildAnteCart(cart, orderRef, currency), [cart, currency, orderRef]);
  const feeLines = useMemo(() => buildCartFeeSummary(cart, currency), [cart, currency]);
  const tax = anteCart?.tax ?? 0;
  const shipping = anteCart?.shipping ?? 0;
  const total = anteCart?.total ?? 0;
  const displayCurrency = currency;
  const minimumOrder = minimumOrderForCart(currency);
  const belowMinimum = total > 0 && !cartMeetsMinimum(cart, currency);
  const isWaiting = pollingOrderRef !== null || isWaitingStatus(status);

  const format = useCallback(
    (minorUnits: number) => formatMoney(minorUnits, displayCurrency),
    [displayCurrency],
  );

  const handleWebhookFunded = useCallback(
    (order: FundedOrder) => {
      const orderCurrency = currency;
      setConfirmedOrder(fundedOrderToConfirmed(order, orderCurrency));
      setPollingOrderRef(null);
      clearCart();
      setStatus(null);
    },
    [clearCart, currency],
  );

  const resetCheckoutWait = useCallback(() => {
    setPollingOrderRef(null);
    setStatus(null);
  }, []);

  const confirmFromSdk = useCallback(
    (ref: string, sessionId: string) => {
      if (!anteCart) return;
      const feeSummary = buildCartFeeSummary(cart, currency);
      setConfirmedOrder({
        orderRef: ref,
        groupId: sessionId,
        currency,
        lines: buildProductCartLines(cart, currency),
        fees: feeSummary.length > 0 ? feeSummary : undefined,
        subtotal: cartSubtotal(cart, currency),
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
    [anteCart, cart, clearCart, currency],
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
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paper-2 text-ink-3"
            aria-hidden
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7h12l-1.2 12.2a1.6 1.6 0 0 1-1.6 1.3H8.8a1.6 1.6 0 0 1-1.6-1.3L6 7Z" />
              <path d="M9 10V6a3 3 0 0 1 6 0v4" />
            </svg>
          </span>
          <h2 className="text-lg font-medium tracking-[-0.02em] text-ink">Your cart is empty</h2>
          <p className="mt-1.5 max-w-[14rem] text-sm leading-relaxed text-ink-3">
            Add items from one currency region, then split the total with Ante group pay.
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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-medium tracking-[-0.02em] text-ink">Your cart</h2>
            {currency ? <CurrencyBadge currency={currency} size="md" /> : null}
          </div>
          <p className="mt-1 text-xs text-ink-3">
            {itemCount} {itemCount === 1 ? "item" : "items"} ·{" "}
            <span className="font-mono text-ink-3">{orderRef}</span>
          </p>
        </div>
        {isWaiting ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-terra-soft px-2.5 py-1 font-mono text-[11px] font-medium text-terra-deep">
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
                  {(line.name || "?").charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{line.name}</p>
                <p className="font-mono text-xs tabular-nums text-ink-3">
                  {format(line.unit_price)} × {line.quantity}
                </p>
              </div>
              <span className="shrink-0 font-mono text-sm font-medium tabular-nums text-ink-2">
                {format(line.quantity * line.unit_price)}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="checkout-totals" aria-label="Order summary">
        <div className="checkout-total-row">
          <dt className="text-ink-3">Subtotal</dt>
          <dd className="font-mono tabular-nums text-ink-2">{format(subtotal)}</dd>
        </div>
        {feeLines.map((fee) => (
          <div key={fee.id} className="checkout-total-row">
            <dt className="text-ink-3">{fee.label}</dt>
            <dd className="font-mono tabular-nums text-ink-2">{format(fee.amount)}</dd>
          </div>
        ))}
        <div className="checkout-total-row">
          <dt className="text-ink-3">Tax (8%)</dt>
          <dd className="font-mono tabular-nums text-ink-2">{format(tax)}</dd>
        </div>
        <div className="checkout-total-row">
          <dt className="text-ink-3">Shipping</dt>
          <dd className="font-mono tabular-nums text-ink-2">{format(shipping)}</dd>
        </div>
        <div className="checkout-total-row checkout-total-row--grand">
          <dt>Total</dt>
          <dd>{format(total)}</dd>
        </div>
      </dl>

      {belowMinimum ? (
        <div className="checkout-minimum-warning mt-4" role="status">
          <p>
            Minimum order is <strong>{format(minimumOrder)}</strong>. Add more items — current
            total is {format(total)}.
          </p>
        </div>
      ) : null}

      {anteCart ? (
        <div className="checkout-ante-button-wrap" ref={anteButtonWrapRef}>
          <AnteButton
            getSignature={signCart}
            cart={anteCart}
            group={{ minSize: 2, maxSize: 6, defaultMode: "equal" }}
            disabled={belowMinimum || pollingOrderRef !== null}
            appearance={{ fullWidth: true, size: "lg" }}
            className="!rounded-full"
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
                reportClientError(apiFallback ? "checkout-fallback" : "checkout", error);
                const raw = String(error.message);
                if (
                  !apiFallback &&
                  (raw.includes("Load failed") || raw.includes("Failed to fetch") || raw.includes("NetworkError"))
                ) {
                  enableApiFallback();
                  setAutoRetry(true);
                  setStatus(
                    "Network hiccup — retrying over a backup connection… If nothing opens, tap Split with Ante again.",
                  );
                  return;
                }
                setStatus(
                  `${checkoutErrorMessage(error)}\n[${error.name}: ${String(error.message).slice(0, 120)}]`,
                );
              },
            }}
          />
        </div>
      ) : null}

      {status ? (
        <div className={statusClass} role="status" aria-live="polite">
          {isWaiting ? <span className="checkout-spinner" aria-hidden /> : null}
          <p className="whitespace-pre-line">{status}</p>
        </div>
      ) : null}

      <p className="checkout-footnote">
        Checkout uses <strong>{mode === "live" ? "live" : "test"}</strong> Ante keys. One currency
        per cart. Order confirmation appears after Ante sends <code>group.funded</code> to{" "}
        <code>/api/webhooks/ante</code>.
      </p>
    </aside>
  );
}

"use client";

import { PlurelButton, type Cart } from "@plurel/react-sdk";
import { useCallback, useEffect, useMemo, useState } from "react";

import { splitPreview } from "@/lib/demo-scenarios";
import { demoApiPath } from "@/lib/demo-config";
import { useCart } from "@/components/cart-context";
import { usePlurelMode } from "@/components/plurel-mode-provider";
import { CurrencyBadge } from "@/components/store/CurrencyBadge";
import { OrderConfirmation } from "@/components/order-confirmation";
import { useOrderFundingPoll } from "@/hooks/use-order-funding-poll";
import { explainPlurelApiError } from "@/lib/plurel-env";
import type { FundedOrder } from "@/lib/order-store";
import { formatMoney } from "@/components/ui/format-money";
import {
  buildPlurelCart,
  buildCartFeeSummary,
  buildProductCartLines,
  cartMeetsMinimum,
  cartSubtotal,
  getProduct,
  makeOrderRef,
  minimumOrderForCart,
  type ConfirmedOrder,
} from "@/lib/store";
import { fetchFundedOrder } from "@/hooks/use-order-funding-poll";
import { reportClientError } from "@/lib/report-client-error";

function checkoutErrorMessage(error: Error): string {
  return explainPlurelApiError(error.message);
}

function fundedOrderToConfirmed(order: FundedOrder): ConfirmedOrder {
  return {
    orderRef: order.orderRef,
    groupId: order.groupId,
    currency: order.currency,
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
  const { cart, itemCount, subtotal, currency, clearCart, people } = useCart();
  const { modeHeaders, mode, publishableKey, ready } = usePlurelMode();
  const [orderRef, setOrderRef] = useState(makeOrderRef);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [pollingOrderRef, setPollingOrderRef] = useState<string | null>(null);

  // A signed order is immutable. Cart or credential changes begin a new order.
  useEffect(() => {
    setOrderRef(makeOrderRef());
  }, [cart, currency, mode]);

  const cartLines = useMemo(() => buildProductCartLines(cart, currency), [cart, currency]);
  const plurelCart = useMemo(() => buildPlurelCart(cart, orderRef, currency), [cart, currency, orderRef]);
  const feeLines = useMemo(() => buildCartFeeSummary(cart, currency), [cart, currency]);
  const tax = plurelCart?.tax ?? 0;
  const shipping = plurelCart?.shipping ?? 0;
  const total = plurelCart?.total ?? 0;
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

  const waitForWebhookConfirmation = useCallback((ref: string) => {
    setPollingOrderRef(ref);
    setStatus("Checkout finished. Waiting for verified order confirmation…");
  }, []);

  useOrderFundingPoll({
    orderRef: pollingOrderRef,
    enabled: pollingOrderRef !== null && confirmedOrder === null,
    onFunded: handleWebhookFunded,
    onError: (message) => { setPollingOrderRef(null); setStatus(message); },
  });

  async function signCart(cartToSign: Cart) {
    const response = await fetch(demoApiPath("/cart/sign"), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...modeHeaders },
      body: JSON.stringify({ cart: cartToSign, publishableKey }),
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
            Choose a scenario or add something you love. Your shared total will appear here.
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

      <div className="split-preview" aria-label="Estimated split">
        <span>Split {people} ways</span>
        <strong>{format(splitPreview(total, people)[0]!)} <small>per person{total % people ? " or less" : ""}</small></strong>
        <p>Preview only. Final shares are set in checkout.</p>
      </div>
      {!ready && <p className="preview-explanation">You’re exploring a price preview. Sandbox checkout will become available when it’s connected. No payment has been created.</p>}
      {plurelCart && ready ? (
        <div className="checkout-plurel-button-wrap">
          <PlurelButton
            getSignature={signCart}
            cart={plurelCart}
            group={{ minSize: people, maxSize: people, defaultMode: "equal" }}
            disabled={belowMinimum || pollingOrderRef !== null}
            appearance={{ fullWidth: true, size: "lg" }}
            className="!rounded-full"
            callbacks={{
              onGroupCreated: () => {
                setPollingOrderRef(orderRef);
                setStatus("Group opened. Waiting for everyone to finish test checkout…");
              },
              onGroupFunded: (_sessionId, fundedOrderRef) => {
                void waitForWebhookConfirmation(fundedOrderRef ?? orderRef);
              },
              onGroupCancelled: () => {
                resetCheckoutWait();
              },
              onGroupExpired: () => {
                resetCheckoutWait();
              },
              onError: (error) => {
                resetCheckoutWait();
                reportClientError("checkout", error);
                setStatus(checkoutErrorMessage(error));
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

      <p className="checkout-footnote">Sandbox only. Use test payment details in checkout. Orders appear as confirmed only after verified payment confirmation; no goods are shipped.</p>
    </aside>
  );
}

import { formatMoney } from "@/components/ui/format-money";
import { CurrencyBadge } from "@/components/store/CurrencyBadge";
import { getProduct, type ConfirmedOrder } from "@/lib/store";

type OrderConfirmationProps = {
  order: ConfirmedOrder;
  onContinueShopping: () => void;
};

export function OrderConfirmation({ order, onContinueShopping }: OrderConfirmationProps) {
  const confirmedDate = new Date(order.confirmedAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const format = (minorUnits: number) => formatMoney(minorUnits, order.currency);

  return (
    <aside className="order-confirmation" aria-label="Order confirmation">
      <div className="order-confirmation__hero">
        <div className="flex items-start gap-3">
          <span className="order-confirmation__badge" aria-hidden>
            ✓
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-medium tracking-[-0.02em] text-mint-deep">
                Order confirmed
              </h2>
              <CurrencyBadge currency={order.currency} size="md" />
            </div>
            <p className="mt-1 text-sm leading-relaxed text-ink-2">
              {order.confirmedVia === "sdk" ? (
                <>
                  Payment confirmed in Ante checkout. Fulfillment is safest after your server
                  receives <code className="rounded bg-white/80 px-1 text-xs">group.funded</code>.
                </>
              ) : (
                <>
                  Payment verified via{" "}
                  <code className="rounded bg-white/80 px-1 text-xs">group.funded</code> webhook —
                  safe to fulfill.
                </>
              )}
            </p>
          </div>
        </div>

        <dl className="order-confirmation__meta text-sm">
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-ink-3">Order ref</dt>
            <dd className="font-mono text-xs font-medium text-ink">{order.orderRef}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-mint-dim/60 py-1 pt-2">
            <dt className="shrink-0 text-ink-3">Group ID</dt>
            <dd className="truncate font-mono text-xs text-ink-2" title={order.groupId}>
              {order.groupId}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-mint-dim/60 py-1 pt-2">
            <dt className="text-ink-3">Confirmed</dt>
            <dd className="text-ink-2">{confirmedDate}</dd>
          </div>
        </dl>
      </div>

      <ul className="order-confirmation__lines" aria-label="Ordered items">
        {order.lines.map((line) => {
          const product = getProduct(line.id);
          return (
            <li key={line.id} className="order-confirmation__line">
              <span className="flex min-w-0 items-center gap-3">
                {line.image_url ? (
                  <img src={line.image_url} alt="" className="checkout-line-thumb" />
                ) : (
                  <span className="checkout-line-thumb checkout-line-thumb--placeholder" aria-hidden>
                    {(line.name || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink">{line.name}</span>
                  <span className="font-mono text-xs tabular-nums text-ink-3">
                    {format(line.unit_price)} × {line.quantity}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-mono font-medium tabular-nums">
                {format(line.quantity * line.unit_price)}
              </span>
            </li>
          );
        })}
      </ul>

      <dl className="order-confirmation__totals text-sm" aria-label="Payment summary">
        <div className="checkout-total-row">
          <dt className="text-ink-3">Subtotal</dt>
          <dd className="font-mono tabular-nums text-ink-2">{format(order.subtotal)}</dd>
        </div>
        {order.fees?.map((fee) => (
          <div key={fee.id} className="checkout-total-row">
            <dt className="text-ink-3">{fee.label}</dt>
            <dd className="font-mono tabular-nums text-ink-2">{format(fee.amount)}</dd>
          </div>
        ))}
        <div className="checkout-total-row">
          <dt className="text-ink-3">Tax</dt>
          <dd className="font-mono tabular-nums text-ink-2">{format(order.tax)}</dd>
        </div>
        <div className="checkout-total-row">
          <dt className="text-ink-3">Shipping</dt>
          <dd className="font-mono tabular-nums text-ink-2">{format(order.shipping)}</dd>
        </div>
        <div className="order-confirmation__paid">
          <dt>Paid total</dt>
          <dd>{format(order.total)}</dd>
        </div>
      </dl>

      <button type="button" onClick={onContinueShopping} className="order-confirmation__cta">
        Continue shopping
      </button>

      <p className="px-6 pb-6 text-[0.6875rem] leading-[1.55] text-ink-4">
        {order.confirmedVia === "sdk" ? (
          <>
            Ante reported this session as funded before the webhook arrived. Configure{" "}
            <code className="rounded bg-white/80 px-1 text-[0.625rem]">group.funded</code> on your deployment for
            production fulfillment.
          </>
        ) : (
          <>
            This screen updated after your server verified the Ante{" "}
            <code className="rounded bg-white/80 px-1 text-[0.625rem]">group.funded</code> webhook.
          </>
        )}
      </p>
    </aside>
  );
}

import { formatUsd } from "@/components/ui/format-usd";
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

  return (
    <aside className="order-confirmation" aria-label="Order confirmation">
      <div className="order-confirmation__hero">
        <div className="flex items-start gap-3">
          <span className="order-confirmation__badge" aria-hidden>
            ✓
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-emerald-950">
              Order confirmed
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
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
            <dt className="text-stone-500">Order ref</dt>
            <dd className="font-mono text-xs font-medium text-stone-900">{order.orderRef}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-emerald-100 py-1 pt-2">
            <dt className="shrink-0 text-stone-500">Group ID</dt>
            <dd className="truncate font-mono text-xs text-stone-700" title={order.groupId}>
              {order.groupId}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-emerald-100 py-1 pt-2">
            <dt className="text-stone-500">Confirmed</dt>
            <dd className="text-stone-700">{confirmedDate}</dd>
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
                  <img
                    src={line.image_url}
                    alt=""
                    className="checkout-line-thumb"
                  />
                ) : (
                  <span className="checkout-line-thumb checkout-line-thumb--placeholder" aria-hidden>
                    {product?.emoji ?? "📦"}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium text-stone-900">{line.name}</span>
                  <span className="text-xs text-stone-500">
                    {formatUsd(line.unit_price)} × {line.quantity}
                  </span>
                </span>
              </span>
              <span className="shrink-0 font-medium">{formatUsd(line.quantity * line.unit_price)}</span>
            </li>
          );
        })}
      </ul>

      <dl className="order-confirmation__totals text-sm" aria-label="Payment summary">
        <div className="checkout-total-row">
          <dt className="text-stone-500">Subtotal</dt>
          <dd className="text-stone-800">{formatUsd(order.subtotal)}</dd>
        </div>
        {order.fees?.map((fee) => (
          <div key={fee.id} className="checkout-total-row">
            <dt className="text-stone-500">{fee.label}</dt>
            <dd className="text-stone-800">{formatUsd(fee.amount)}</dd>
          </div>
        ))}
        <div className="checkout-total-row">
          <dt className="text-stone-500">Tax</dt>
          <dd className="text-stone-800">{formatUsd(order.tax)}</dd>
        </div>
        <div className="checkout-total-row">
          <dt className="text-stone-500">Shipping</dt>
          <dd className="text-stone-800">{formatUsd(order.shipping)}</dd>
        </div>
        <div className="order-confirmation__paid">
          <dt>Paid total</dt>
          <dd>{formatUsd(order.total)}</dd>
        </div>
      </dl>

      <button type="button" onClick={onContinueShopping} className="order-confirmation__cta">
        Continue shopping
      </button>

      <p className="px-6 pb-5 text-xs leading-relaxed text-emerald-900/55">
        {order.confirmedVia === "sdk" ? (
          <>
            Ante reported this session as funded before the webhook arrived. Configure{" "}
            <code className="rounded bg-white/80 px-1">group.funded</code> on your deployment for
            production fulfillment.
          </>
        ) : (
          <>
            This screen updated after your server verified the Ante{" "}
            <code className="rounded bg-white/80 px-1">group.funded</code> webhook.
          </>
        )}
      </p>
    </aside>
  );
}

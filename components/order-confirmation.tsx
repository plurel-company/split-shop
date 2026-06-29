import { formatUsd, type ConfirmedOrder } from "@/lib/store";

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
    <aside className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-lg text-white"
          aria-hidden
        >
          ✓
        </span>
        <div>
          <h2 className="text-lg font-semibold text-emerald-950">Order confirmed</h2>
          <p className="mt-1 text-sm text-emerald-900/80">
            Confirmed via <code className="rounded bg-white/80 px-1">group.funded</code> webhook —
            safe to fulfill this order.
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-2 rounded-xl border border-emerald-200/80 bg-white/70 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Order</dt>
          <dd className="font-medium text-stone-900">{order.orderRef}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Group</dt>
          <dd className="truncate font-mono text-xs text-stone-700">{order.groupId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-stone-500">Confirmed</dt>
          <dd className="text-stone-700">{confirmedDate}</dd>
        </div>
      </dl>

      <ul className="mt-4 space-y-2 text-sm">
        {order.lines.map((line) => (
          <li key={line.id} className="flex items-center justify-between gap-4 text-stone-700">
            <span className="flex min-w-0 items-center gap-3">
              {line.image_url ? (
                <img
                  src={line.image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg object-cover"
                />
              ) : null}
              <span className="truncate">
                {line.name} × {line.quantity}
              </span>
            </span>
            <span>{formatUsd(line.quantity * line.unit_price)}</span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-1 border-t border-emerald-200/80 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-stone-500">Subtotal</dt>
          <dd>{formatUsd(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone-500">Tax</dt>
          <dd>{formatUsd(order.tax)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-stone-500">Shipping</dt>
          <dd>{formatUsd(order.shipping)}</dd>
        </div>
        <div className="flex justify-between pt-2 text-base font-semibold text-stone-900">
          <dt>Paid</dt>
          <dd>{formatUsd(order.total)}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onContinueShopping}
        className="mt-6 w-full rounded-xl bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800"
      >
        Continue shopping
      </button>

      <p className="mt-4 text-xs leading-relaxed text-emerald-900/60">
        This screen updated after your server verified the Ante{" "}
        <code className="rounded bg-white/80 px-1">group.funded</code> webhook.
      </p>
    </aside>
  );
}

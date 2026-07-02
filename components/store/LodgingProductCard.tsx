"use client";

import { useCart } from "@/components/cart-context";
import { CurrencyBadge } from "@/components/store/CurrencyBadge";
import { FeePreview } from "@/components/store/FeePreview";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { formatMoney } from "@/components/ui/format-money";
import { type Product } from "@/lib/store";

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-ink-3">{label}</dt>
      <dd className="text-sm font-medium text-ink-2">{value}</dd>
    </div>
  );
}

type LodgingProductCardProps = {
  product: Product;
};

export function LodgingProductCard({ product }: LodgingProductCardProps) {
  const { cart, addItem, removeItem, currency: cartCurrency } = useCart();
  const quantity = cart[product.id] ?? 0;
  const lodging = product.lodging;
  const lockedOut = cartCurrency !== null && cartCurrency !== product.currency;

  return (
    <article
      className={`product-card group flex flex-col overflow-hidden ${lockedOut ? "product-card--muted" : ""}`}
    >
      <div className="product-card__media relative aspect-[16/10] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <CurrencyBadge currency={product.currency} />
          {quantity > 0 ? (
            <span className="rounded-full bg-white/95 px-2.5 py-1 font-mono text-[11px] font-medium text-ink shadow-sm backdrop-blur-sm">
              {quantity} {quantity === 1 ? "night" : "nights"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-medium leading-snug tracking-[-0.025em] text-ink">
              {product.name}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{product.description}</p>
          </div>
        </div>

        {lodging ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            <MetaItem label="Beds" value={lodging.beds} />
            <MetaItem label="Baths" value={lodging.baths} />
            {lodging.sqft ? <MetaItem label="Size" value={lodging.sqft} /> : null}
            {lodging.rooms ? <MetaItem label="Layout" value={lodging.rooms} /> : null}
            {lodging.buildings ? (
              <div className="col-span-2 sm:col-span-4">
                <MetaItem label="Buildings" value={lodging.buildings} />
              </div>
            ) : null}
          </dl>
        ) : null}

        {lodging?.amenities.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {lodging.amenities.map((amenity) => (
              <li
                key={amenity}
                className="rounded-full border border-hair-2 bg-white px-2.5 py-1 font-mono text-[11px] text-ink-2"
              >
                {amenity}
              </li>
            ))}
          </ul>
        ) : null}

        {product.fees?.length ? (
          <FeePreview fees={product.fees} currency={product.currency} />
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-hair pt-4">
          <div>
            <p className="font-mono text-xl font-medium tabular-nums text-ink">
              {formatMoney(product.unitPrice, product.currency)}
              <span className="font-sans text-sm font-normal text-ink-3"> / night</span>
            </p>
          </div>
          <QuantityStepper
            quantity={quantity}
            unitLabel="night"
            onAdd={() => addItem(product.id)}
            onRemove={() => removeItem(product.id)}
            productName={product.name}
            disabled={lockedOut && quantity === 0}
          />
        </div>
      </div>
    </article>
  );
}

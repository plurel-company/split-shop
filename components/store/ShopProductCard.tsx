"use client";

import { useCart } from "@/components/cart-context";
import { CurrencyBadge } from "@/components/store/CurrencyBadge";
import { QuantityStepper } from "@/components/store/QuantityStepper";
import { formatMoney } from "@/components/ui/format-money";
import { type Product } from "@/lib/store";

type ShopProductCardProps = {
  product: Product;
};

export function ShopProductCard({ product }: ShopProductCardProps) {
  const { cart, addItem, removeItem, currency: cartCurrency } = useCart();
  const quantity = cart[product.id] ?? 0;
  const lockedOut = cartCurrency !== null && cartCurrency !== product.currency;

  return (
    <article
      className={`product-card group flex flex-col overflow-hidden ${lockedOut ? "product-card--muted" : ""}`}
    >
      <div className="product-card__media relative aspect-[4/5] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <CurrencyBadge currency={product.currency} />
          {quantity > 0 ? (
            <span className="rounded-full bg-ink/90 px-2.5 py-1 font-mono text-[11px] font-medium text-white backdrop-blur-sm">
              {quantity} in cart
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-medium leading-snug tracking-[-0.015em] text-ink">{product.name}</h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-3">
              {product.description}
            </p>
          </div>
          <span className="text-lg opacity-35 transition group-hover:opacity-50" aria-hidden>
            {product.emoji}
          </span>
        </div>

        <div className="mt-auto pt-5">
          <div className="flex items-end justify-between gap-4">
            <p className="font-mono text-base font-medium tabular-nums text-ink">
              {formatMoney(product.unitPrice, product.currency)}
            </p>
            <QuantityStepper
              quantity={quantity}
              unitLabel="item"
              onAdd={() => addItem(product.id)}
              onRemove={() => removeItem(product.id)}
              productName={product.name}
              size="sm"
              disabled={lockedOut && quantity === 0}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

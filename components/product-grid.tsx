"use client";

import { useCart } from "@/components/cart-context";
import {
  formatUsd,
  PRODUCT_SECTIONS,
  productsInCategory,
  type Product,
  type ProductFee,
} from "@/lib/store";

function FeeList({ fees }: { fees: ProductFee[] }) {
  return (
    <ul className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-xs text-stone-500">
      {fees.map((fee) => (
        <li key={fee.id} className="flex justify-between gap-2">
          <span>{fee.label}</span>
          <span className="shrink-0 text-stone-600">
            {formatUsd(fee.amount)}
            {fee.billing === "per_night" ? " / night" : " / stay"}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { cart, addItem, removeItem } = useCart();
  const quantity = cart[product.id] ?? 0;
  const isLodging = product.category === "lodging";
  const unitLabel = isLodging ? "night" : "item";

  return (
    <article className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <img
        src={product.imageUrl}
        alt={product.name}
        className="h-44 w-full rounded-xl object-cover"
      />
      <div className="mt-3 text-2xl" aria-hidden>
        {product.emoji}
      </div>
      <h3 className="mt-2 text-lg font-semibold text-stone-900">{product.name}</h3>
      <p className="mt-1 flex-1 text-sm text-stone-500">{product.description}</p>

      {product.lodging ? (
        <dl className="mt-3 grid gap-1.5 text-xs text-stone-600">
          {product.lodging.rooms ? (
            <div className="flex justify-between gap-2">
              <dt className="text-stone-400">Layout</dt>
              <dd className="text-right">{product.lodging.rooms}</dd>
            </div>
          ) : null}
          {product.lodging.buildings ? (
            <div className="flex justify-between gap-2">
              <dt className="text-stone-400">Buildings</dt>
              <dd className="text-right">{product.lodging.buildings}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt className="text-stone-400">Beds</dt>
            <dd className="text-right">{product.lodging.beds}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-stone-400">Baths</dt>
            <dd className="text-right">{product.lodging.baths}</dd>
          </div>
          {product.lodging.sqft ? (
            <div className="flex justify-between gap-2">
              <dt className="text-stone-400">Size</dt>
              <dd className="text-right">{product.lodging.sqft}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {product.lodging?.amenities.length ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {product.lodging.amenities.map((amenity) => (
            <li
              key={amenity}
              className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600"
            >
              {amenity}
            </li>
          ))}
        </ul>
      ) : null}

      {product.fees?.length ? <FeeList fees={product.fees} /> : null}

      <p className="mt-4 text-base font-medium text-stone-900">
        {formatUsd(product.unitPrice)}
        {isLodging ? <span className="text-sm font-normal text-stone-500"> / night</span> : null}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => removeItem(product.id)}
          disabled={quantity === 0}
          className="h-9 w-9 rounded-full border border-stone-200 text-stone-700 disabled:opacity-40"
          aria-label={`Remove one ${unitLabel} at ${product.name}`}
        >
          −
        </button>
        <span className="min-w-8 text-center text-sm font-medium">
          {quantity}
          {quantity > 0 ? (
            <span className="block text-[10px] font-normal uppercase tracking-wide text-stone-400">
              {quantity === 1 ? unitLabel : `${unitLabel}s`}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={() => addItem(product.id)}
          className="h-9 w-9 rounded-full bg-stone-900 text-white"
          aria-label={`Add one ${unitLabel} at ${product.name}`}
        >
          +
        </button>
      </div>
    </article>
  );
}

export function ProductGrid() {
  return (
    <div className="space-y-10">
      {PRODUCT_SECTIONS.map((section) => {
        const products = productsInCategory(section.id);
        return (
          <section key={section.id}>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-stone-900">{section.title}</h2>
              <p className="mt-1 text-sm text-stone-500">{section.subtitle}</p>
            </div>
            <div
              className={
                section.id === "lodging"
                  ? "grid gap-4 lg:grid-cols-2 xl:grid-cols-3"
                  : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

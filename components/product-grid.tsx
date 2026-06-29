"use client";

import { useCart } from "@/components/cart-context";
import { formatUsd, PRODUCTS } from "@/lib/store";

export function ProductGrid() {
  const { cart, addItem, removeItem } = useCart();

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {PRODUCTS.map((product) => {
        const quantity = cart[product.id] ?? 0;
        return (
          <article
            key={product.id}
            className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-36 w-full rounded-xl object-cover"
            />
            <div className="mt-3 text-2xl" aria-hidden>
              {product.emoji}
            </div>
            <h2 className="mt-3 text-lg font-semibold text-stone-900">{product.name}</h2>
            <p className="mt-1 flex-1 text-sm text-stone-500">{product.description}</p>
            <p className="mt-4 text-base font-medium text-stone-900">
              {formatUsd(product.unitPrice)}
            </p>
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => removeItem(product.id)}
                disabled={quantity === 0}
                className="h-9 w-9 rounded-full border border-stone-200 text-stone-700 disabled:opacity-40"
                aria-label={`Remove one ${product.name}`}
              >
                −
              </button>
              <span className="min-w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => addItem(product.id)}
                className="h-9 w-9 rounded-full bg-stone-900 text-white"
                aria-label={`Add one ${product.name}`}
              >
                +
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

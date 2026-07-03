"use client";

import { useCart } from "@/components/cart-context";
import { LodgingProductCard } from "@/components/store/LodgingProductCard";
import { SectionHeader } from "@/components/store/SectionHeader";
import { ShopProductCard } from "@/components/store/ShopProductCard";
import { catalogInCurrency, PRODUCT_SECTIONS } from "@/lib/store";

export function ProductGrid() {
  const { notice, dismissNotice, currency } = useCart();
  const catalog = catalogInCurrency(currency);

  return (
    <div className="space-y-14 lg:space-y-16">
      {notice ? (
        <div className="cart-notice" role="status">
          <p>{notice}</p>
          <button type="button" onClick={dismissNotice} className="cart-notice__dismiss">
            Dismiss
          </button>
        </div>
      ) : null}

      {PRODUCT_SECTIONS.map((section, sectionIndex) => {
        const products = catalog.filter((product) => product.category === section.id);
        const isLodging = section.id === "lodging";
        const productCount = products.length;

        return (
          <section key={section.id} aria-labelledby={`section-${section.id}`}>
            <SectionHeader
              id={`section-${section.id}`}
              index={String(sectionIndex + 1).padStart(2, "0")}
              title={section.title}
              subtitle={section.subtitle}
              count={productCount}
              countLabel={isLodging ? "listings" : "products"}
            />

            <div
              className={
                isLodging
                  ? "grid gap-5 sm:grid-cols-2"
                  : "grid gap-5 min-[480px]:grid-cols-2 md:grid-cols-3"
              }
            >
              {products.map((product) =>
                isLodging ? (
                  <LodgingProductCard key={product.id} product={product} />
                ) : (
                  <ShopProductCard key={product.id} product={product} />
                ),
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

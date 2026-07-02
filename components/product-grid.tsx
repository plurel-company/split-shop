"use client";

import { useCart } from "@/components/cart-context";
import { CurrencySubheader } from "@/components/store/CurrencySubheader";
import { LodgingProductCard } from "@/components/store/LodgingProductCard";
import { SectionHeader } from "@/components/store/SectionHeader";
import { ShopProductCard } from "@/components/store/ShopProductCard";
import { PRODUCT_SECTIONS, productsByCurrencyInCategory } from "@/lib/store";

export function ProductGrid() {
  const { notice, dismissNotice } = useCart();

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
        const currencyGroups = productsByCurrencyInCategory(section.id);
        const isLodging = section.id === "lodging";
        const productCount = currencyGroups.reduce((sum, group) => sum + group.products.length, 0);

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

            <div className="space-y-10">
              {currencyGroups.map((group) => (
                <div key={`${section.id}-${group.currency}`}>
                  <CurrencySubheader
                    currency={group.currency}
                    productCount={group.products.length}
                    countLabel={isLodging ? "listings" : "products"}
                  />
                  <div
                    className={
                      isLodging
                        ? "mt-4 grid gap-5 sm:grid-cols-2"
                        : "mt-4 grid gap-5 min-[480px]:grid-cols-2 md:grid-cols-3"
                    }
                  >
                    {group.products.map((product) =>
                      isLodging ? (
                        <LodgingProductCard key={product.id} product={product} />
                      ) : (
                        <ShopProductCard key={product.id} product={product} />
                      ),
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

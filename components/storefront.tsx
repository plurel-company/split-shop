"use client";

import { AnteProvider } from "@splitante/react-sdk";

import { CheckoutPanel } from "@/components/checkout-panel";
import { ProductGrid } from "@/components/product-grid";

type StorefrontProps = {
  merchantId: string;
  publishableKey: string;
};

export function Storefront({ merchantId, publishableKey }: StorefrontProps) {
  return (
    <AnteProvider
      merchantId={merchantId}
      publishableKey={publishableKey}
      environment="sandbox"
      theme="light"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ProductGrid />
        <CheckoutPanel />
      </div>
    </AnteProvider>
  );
}

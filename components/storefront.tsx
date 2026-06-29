"use client";

import { AnteProvider } from "@splitante/react-sdk";

import { useAnteMode } from "@/components/ante-mode-provider";
import { CheckoutPanel } from "@/components/checkout-panel";
import { ProductGrid } from "@/components/product-grid";

export function Storefront() {
  const { merchantId, publishableKey, environment, mode } = useAnteMode();

  return (
    <AnteProvider
      key={`${mode}-${publishableKey.slice(0, 12)}`}
      merchantId={merchantId}
      publishableKey={publishableKey}
      environment={environment}
      theme="light"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <ProductGrid />
        <CheckoutPanel />
      </div>
    </AnteProvider>
  );
}

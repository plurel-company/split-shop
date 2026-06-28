import { CartProvider } from "@/components/cart-context";
import { SetupBanner } from "@/components/setup-banner";
import { StoreShell } from "@/components/store-shell";
import { Storefront } from "@/components/storefront";

export default function HomePage() {
  const merchantId = process.env.NEXT_PUBLIC_ANTE_MERCHANT_ID?.trim() ?? "";
  const publishableKey = process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY?.trim() ?? "";
  const configured = Boolean(merchantId && publishableKey);

  return (
    <CartProvider>
      <StoreShell configured={configured}>
        <SetupBanner />
        {configured ? (
          <Storefront merchantId={merchantId} publishableKey={publishableKey} />
        ) : (
          <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
            Copy <code>.env.example</code> to <code>.env.local</code> and add your Ante sandbox
            credentials from the merchant dashboard.
          </aside>
        )}
      </StoreShell>
    </CartProvider>
  );
}

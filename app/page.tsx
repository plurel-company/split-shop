import { CartProvider } from "@/components/cart-context";
import { AnteModeProvider } from "@/components/ante-mode-provider";
import { SetupBanner } from "@/components/setup-banner";
import { StoreShell } from "@/components/store-shell";
import { Storefront } from "@/components/storefront";
import { credentialAvailability, merchantId, resolvePublishableKey } from "@/lib/ante-credentials";

export default function HomePage() {
  const id = merchantId();
  const testPublishableKey = resolvePublishableKey("sandbox");
  const livePublishableKey = resolvePublishableKey("live");
  const availability = credentialAvailability();
  const configured = availability.merchantId && (availability.testKey || availability.liveKey);

  return (
    <CartProvider>
      <AnteModeProvider
        merchantId={id}
        testPublishableKey={testPublishableKey}
        livePublishableKey={livePublishableKey}
      >
        <StoreShell configured={configured}>
          <SetupBanner />
          {configured ? (
            <Storefront />
          ) : (
            <aside className="rounded-2xl border border-terra-dim bg-terra-soft p-6 text-sm text-terra-deep">
              Copy <code>.env.example</code> to <code>.env.local</code> and add your Ante credentials
              from the merchant dashboard. Set test and/or live publishable keys.
            </aside>
          )}
        </StoreShell>
      </AnteModeProvider>
    </CartProvider>
  );
}

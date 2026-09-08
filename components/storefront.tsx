"use client";

import { useEffect, useState } from "react";
import { PlurelProvider } from "@plurel/react-sdk";

import { usePlurelMode } from "@/components/plurel-mode-provider";
import { CheckoutPanel } from "@/components/checkout-panel";
import { demoApiPath } from "@/lib/demo-config";
import { useCart } from "./cart-context";
import { ProductGrid } from "@/components/product-grid";

/** The SDK's checkout iframe ships allow="payment *; clipboard-write" — without
 *  `web-share` the browser blocks navigator.share inside it, so the checkout's
 *  invite buttons silently fall back to copy. Patch the allow list the moment
 *  the SDK inserts the iframe (re-assign src so the policy applies to the
 *  document that loads). Remove when @plurel/sdk grants web-share itself. */
function useGrantWebShareToCheckout() {
  useEffect(() => {
    const patch = (el: Element) => {
      if (!(el instanceof HTMLIFrameElement)) return;
      const id = el.id;
      if (id !== "plurel-checkout-iframe" && id !== "ante-checkout-iframe") return;
      if (el.allow.includes("web-share")) return;
      el.allow = `${el.allow}; web-share`;
      const src = el.src;
      if (src) el.src = src;
    };
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          patch(node);
          node.querySelectorAll?.("iframe#plurel-checkout-iframe, iframe#ante-checkout-iframe").forEach(patch);
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
}

export function Storefront() {
  const { merchantId, publishableKey, environment, ready } = usePlurelMode();
  const { resetRevision } = useCart();
  const [origin, setOrigin] = useState("https://plurelpay.com");
  useEffect(() => { setOrigin(window.location.origin); }, []);
  useGrantWebShareToCheckout();
  const content = <div className="store-grid"><div className="min-w-0"><ProductGrid /></div><div className="cart-column" id="cart"><CheckoutPanel key={resetRevision} /></div></div>;
  // The catalog and split calculator need no SDK credentials or database connection.
  if (!ready) return content;
  return <PlurelProvider key={publishableKey} merchantId={merchantId} publishableKey={publishableKey} environment={environment} theme="light" apiBaseUrl={demoApiPath("/plurel/v1")} payBaseUrl={origin}>{content}</PlurelProvider>;
}

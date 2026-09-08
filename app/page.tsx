import { CartProvider } from "@/components/cart-context";
import { PlurelModeProvider } from "@/components/plurel-mode-provider";
import { StoreShell } from "@/components/store-shell";
import { Storefront } from "@/components/storefront";

export default function HomePage() {
  return <CartProvider><PlurelModeProvider><StoreShell><Storefront /></StoreShell></PlurelModeProvider></CartProvider>;
}

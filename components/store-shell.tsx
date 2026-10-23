import { CurrencyPicker } from "@/components/store/CurrencyPicker";
import { DemoControls } from "@/components/demo-controls";
import { demoAssetPath } from "@/lib/demo-config";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return <div className="store-page">
    <a className="skip-link" href="#catalog">Skip to the shop</a>
    <header className="store-header"><div className="header-bar">
      <a className="header-brand" href={demoAssetPath("/")} aria-label="SplitShop home"><span className="splitshop-symbol" aria-hidden="true">//</span><span className="splitshop-wordmark">splitshop<span>.dev</span></span></a>
      <nav className="header-pill pillnav" aria-label="Shop categories">
        <a href="#section-shop">Everyday</a><a href="#section-lodging">Getaways</a><a href="#section-tickets">Good nights</a><a href="#section-gifts">Big gifts</a>
      </nav>
      <div className="header-actions"><a className="developer-link" href="https://plurelpay.com/docs">Developer docs</a><span className="demo-label">SANDBOX</span><CurrencyPicker /></div>
    </div></header>
    <main className="store-container" id="catalog">
      <section className="store-hero">
        <div><p className="sec-eyebrow"><span className="sec-eyebrow__idx">SPLITSHOP</span> / CHECKOUT PLAYGROUND</p>
          <h1 className="display store-hero__title">Build a cart.<br /><span className="store-hero__accent">Split the bill.</span></h1>
          <p className="store-hero__lede">The weekend away. The perfect gift. The night you’ll talk about for years. Build a cart and see how a group pays together.</p>
          <p className="hero-caption">A reference storefront for developers. Test checkout only.</p>
        </div>
        <div className="hero-note"><span className="hero-note__label">THE TEST RUN</span><ol className="test-run"><li><span>01</span>Build your cart</li><li><span>02</span>Invite the group</li><li><span>03</span>Try the checkout</li></ol><span>Nothing here ships.<br />No real money moves.</span></div>
      </section>
      <DemoControls />
      {children}
    </main>
    <footer className="site-footer"><div className="site-footer__inner">
      <div className="site-footer__brand-row"><div className="footer-brand"><span className="splitshop-symbol" aria-hidden="true">//</span><span className="splitshop-wordmark">splitshop<span>.dev</span></span></div><p className="footer-quote">A checkout you can take apart.</p></div>
      <div className="site-footer__legal"><span>Demo storefront · Sandbox only · No real orders</span><a href="https://plurelpay.com/docs">Explore the integration docs ↗</a></div>
    </div></footer>
  </div>;
}

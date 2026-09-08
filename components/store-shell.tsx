import { PlurelMark } from "@/components/plurel-mark";
import { CurrencyPicker } from "@/components/store/CurrencyPicker";
import { DemoControls } from "@/components/demo-controls";

export function StoreShell({ children }: { children: React.ReactNode }) {
  return <div className="store-page">
    <a className="skip-link" href="#catalog">Skip to the shop</a>
    <header className="store-header"><div className="header-bar">
      <a className="header-brand" href="/"><PlurelMark /><span className="brand-name">Plurel Pay</span></a>
      <nav className="header-pill pillnav" aria-label="Shop categories">
        <a href="#section-shop">Everyday</a><a href="#section-lodging">Getaways</a><a href="#section-tickets">Good nights</a><a href="#section-gifts">Big gifts</a>
      </nav>
      <div className="header-actions"><span className="demo-label">SANDBOX</span><CurrencyPicker /></div>
    </div></header>
    <main className="store-container" id="catalog">
      <section className="store-hero">
        <div><p className="sec-eyebrow"><span className="sec-eyebrow__idx">THE TOGETHER COLLECTION</span> / VOL. 01</p>
          <h1 className="display store-hero__title">Good things.<br /><span className="store-hero__accent">Better together.</span></h1>
          <p className="store-hero__lede">The weekend away. The perfect gift. The night you’ll talk about for years. Build a cart and see how a group pays together.</p>
          <p className="hero-caption">An interactive Plurel Pay shop · Test checkout only</p>
        </div>
        <div className="hero-note"><span aria-hidden="true" className="hero-note__number">÷</span><p>Make the plan.<br />Share the cost.</p><span>Nothing here ships.<br />No real money moves.</span></div>
      </section>
      <DemoControls />
      {children}
    </main>
    <footer className="site-footer"><div className="site-footer__inner">
      <div className="site-footer__brand-row"><div className="footer-brand"><PlurelMark /><span className="footer-brand__name">Plurel Pay</span></div><p className="footer-quote">Less chasing. <em>More together.</em></p></div>
      <div className="site-footer__legal"><span>Demo storefront · Sandbox only · No real orders</span><a href="/docs">Explore the integration docs ↗</a></div>
    </div></footer>
  </div>;
}

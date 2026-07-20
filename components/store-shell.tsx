import { PlurelMark } from "@/components/plurel-mark";
import { PlurelModeSwitch } from "@/components/plurel-mode-switch";
import { CurrencyPicker } from "@/components/store/CurrencyPicker";

type StoreShellProps = {
  configured: boolean;
  children: React.ReactNode;
};

export function StoreShell({ configured, children }: StoreShellProps) {
  return (
    <div className="store-page">
      <header className="store-header">
        <div className="header-bar">
          <a
            className="header-brand"
            href="https://plurelpay.com"
            target="_blank"
            rel="noreferrer"
          >
            <PlurelMark />
            <span className="brand-name">Plurel Pay</span>
          </a>

          <div className="header-pill">
            <nav className="pillnav">
              <a href="#section-shop">Shop</a>
              <a href="#section-lodging">Stays</a>
              <a href="#section-tickets">Tickets</a>
              <a href="#section-gifts">Gifts</a>
              <a href="https://plurelpay.com/docs" target="_blank" rel="noreferrer">
                Docs
              </a>
            </nav>
          </div>

          <div className="header-actions">
            <CurrencyPicker />
            {!configured ? <span className="header-env-pill">Configure env</span> : null}
            <a
              className="header-demo"
              href="https://plurelpay.com"
              target="_blank"
              rel="noreferrer"
            >
              plurelpay.com ↗
            </a>
          </div>
        </div>
      </header>

      <main className="store-container">
        <section className="store-hero">
          <p className="sec-eyebrow store-hero__eyebrow">
            Open demo · Built on the Plurel Pay SDK
          </p>
          <h1 className="display store-hero__title">
            Split <span className="store-hero__accent">Shop</span>
          </h1>
          <p className="store-hero__lede">
            Shop goods, book stays, grab event tickets, and pool group gifts — then open
            Plurel Pay hosted group checkout to split payment with friends.
          </p>

          {configured ? (
            <div className="store-hero__cluster">
              <span className="store-hero__cluster-label">Checkout mode</span>
              <PlurelModeSwitch />
            </div>
          ) : null}
        </section>

        {children}
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand-row">
            <div className="footer-brand">
              <PlurelMark className="plurel-mark plurel-mark--footer" />
              <span className="footer-brand__name">Plurel Pay</span>
            </div>
            <p className="footer-quote">
              Built so nobody has to <em>front the bill</em> — or chase their friends for
              it.
            </p>
          </div>

          <p className="site-footer__dev">
            Built with{" "}
            <a href="https://plurelpay.com/docs" target="_blank" rel="noreferrer">
              @plurel/react-sdk
            </a>
            . Fulfill orders on <code>group.funded</code> webhooks. Full guides in the{" "}
            <a href="https://plurelpay.com/docs" target="_blank" rel="noreferrer">
              Plurel Pay docs
            </a>{" "}
            ↗
          </p>

          <div className="site-footer__legal">
            <span>© 2026 Plurel Inc. All rights reserved. · Open demo · Test mode · No real charges</span>
            <a href="https://plurelpay.com" target="_blank" rel="noreferrer">
              plurelpay.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

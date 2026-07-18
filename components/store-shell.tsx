import { PlurelModeSwitch } from "@/components/plurel-mode-switch";
import { CurrencyPicker } from "@/components/store/CurrencyPicker";

type StoreShellProps = {
  configured: boolean;
  children: React.ReactNode;
};

function PlurelMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? "plurel-mark"}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width="64"
      height="64"
      role="img"
      aria-hidden="true"
    >
      <circle cx="32" cy="14" r="6.5" fill="#F26A2E" />
      <circle cx="20" cy="30" r="9" fill="#0D0F12" />
      <circle cx="44" cy="30" r="9" fill="#0D0F12" />
      <path
        d="M14.5 41c3.2 10.2 10.8 16.5 17.5 16.5S46.3 51.2 49.5 41c-3.6 6.4-9.8 10-17.5 10S18.1 47.4 14.5 41z"
        fill="#E6E1DC"
      />
    </svg>
  );
}

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

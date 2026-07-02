import { AnteModeSwitch } from "@/components/ante-mode-switch";

type StoreShellProps = {
  configured: boolean;
  children: React.ReactNode;
};

export function StoreShell({ configured, children }: StoreShellProps) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <header className="store-hero mb-12 sm:mb-14">
          {/* Top row reads as a navbar: brand on the left, docs anchored to the
             top-right corner — never floating in the hero's whitespace. */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="orb-sphere inline-flex h-8 w-8 items-center justify-center">
                <span className="sr-only">A</span>
              </span>
              <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-terra">
                Ante open demo
              </p>
            </div>
            {!configured ? (
              <span className="shrink-0 rounded-full bg-terra-soft px-4 py-2 text-sm font-medium text-terra-deep">
                Configure env
              </span>
            ) : null}
          </div>

          {/* Title block, with the mode switch seated beside the lede. */}
          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-medium tracking-[-0.035em] text-ink sm:text-4xl lg:text-[2.5rem]">
                Split{" "}
                <span className="font-serif italic text-terra" style={{ fontSize: "1.05em", letterSpacing: "-0.01em" }}>
                  Shop
                </span>
              </h1>
              <p className="mt-3 text-base leading-relaxed text-ink-2">
                Shop physical goods and book stays across USD, EUR, GBP, and JPY — then open
                Ante&apos;s hosted group checkout to split payment with friends.
              </p>
            </div>

            {configured ? (
              <div className="shrink-0 rounded-xl border border-hair bg-white/90 p-4 backdrop-blur-sm">
                <p className="mb-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-3">
                  Checkout mode
                </p>
                <AnteModeSwitch />
              </div>
            ) : null}
          </div>
        </header>

        {children}

        <footer className="mt-16 border-t border-hair pt-8 font-mono text-[11px] leading-[1.55] tracking-[0.02em] text-ink-3">
          Built with{" "}
          <a
            href="https://splitante.com/docs/sdk"
            className="font-medium text-ink-2 underline decoration-hair-2 underline-offset-2 hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            @splitante/react-sdk
          </a>
          . Fulfill orders on <code className="rounded bg-paper-2 px-1 text-ink-2">group.funded</code> webhooks. Full guides
          in the{" "}
          <a
            href="https://splitante.com/docs"
            className="font-medium text-ink-2 underline decoration-hair-2 underline-offset-2 hover:text-ink"
            target="_blank"
            rel="noreferrer"
          >
            Ante docs
          </a>
          {" "}↗
        </footer>
      </main>
    </div>
  );
}

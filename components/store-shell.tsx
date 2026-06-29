import Link from "next/link";

import { AnteModeSwitch } from "@/components/ante-mode-switch";

type StoreShellProps = {
  configured: boolean;
  children: React.ReactNode;
};

export function StoreShell({ configured, children }: StoreShellProps) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Ante demo</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Split Shop</h1>
          <p className="mt-2 max-w-xl text-sm text-stone-500">
            A tiny storefront that signs carts on the server and opens Ante&apos;s hosted group
            checkout modal.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="https://splitante.com/docs"
            className="rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-700 hover:bg-stone-100"
            target="_blank"
            rel="noreferrer"
          >
            Ante docs
          </Link>
          {configured ? <AnteModeSwitch /> : null}
          {!configured ? (
            <span className="rounded-full bg-amber-100 px-4 py-2 font-medium text-amber-800">
              Configure env
            </span>
          ) : null}
        </div>
      </header>

      {children}

      <footer className="mt-12 border-t border-stone-200 pt-6 text-xs text-stone-400">
        Built with{" "}
        <a href="https://splitante.com/docs/sdk" className="underline" target="_blank" rel="noreferrer">
          @splitante/react-sdk
        </a>
        . Fulfill orders on <code>group.funded</code> webhooks.
      </footer>
    </main>
  );
}

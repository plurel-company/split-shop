# Split Shop brand preview

Scope: this checkout only. No commit, production merge, deployment, resource creation, domain change or secret change is authorized by this handoff.

## Visual continuity

The existing Plurel/Pay orange-starburst SVGs are retained. Body and controls now use the original Endform Alte Haas Grotesk regular/bold WOFF2 files copied byte-for-byte from the authorized investor-demo font directory, with `Alte Haas Grotesk licence.rtf` included. Marketing headings retain licensed Newsreader. The default paper canvas matches the investor app at `#fafaf7`; cards are white, with 4–8 px control/card corners, flat borders, readable labels and visible keyboard focus. The older Tailwind palette override was removed; fees, currency badges, cart states, confirmation and icons now use the shared foundation. Local fonts are bundled so they work at both `/` and `/demo/shop/`. Header/footer brand links respect the demo mount. The docs link targets the existing Pay documentation.

Font QA expects **four** `@font-face` definitions: Alte Haas Grotesk regular and bold, plus Newsreader regular and italic. The existing Libre Franklin asset/licence is preserved but is no longer referenced by CSS. The source app checkout was read only; only this storefront checkout received copied assets.

Cart arithmetic, currency conversion, taxes/fees, split rounding, sandbox enforcement, SDK callbacks, signature validation, polling and verified-webhook fulfillment are unchanged. Product prices and steppers can wrap at narrow widths. Browser/interaction review belongs to the main controller; this checkout has not been browsed.

## Changed files

Existing edits were retained and extended in `app/globals.css`, `app/icon.svg`, `app/layout.tsx`, `app/plurel-tokens.css`, `app/plurel-theme.css` and `components/store-shell.tsx`. The original untracked `public/brand/plurel/` assets and font licenses remain intact.

Added under `public/brand/plurel/fonts/`: `AlteHaasGroteskRegular.woff2`, `AlteHaasGroteskBold.woff2` and `Alte Haas Grotesk licence.rtf`.

Additional visual changes: `app/apple-icon.tsx`, `app/opengraph-image.tsx`, `components/plurel-mark.tsx`, `components/checkout-panel.tsx`, and `components/store/{CurrencyBadge,FeePreview,LodgingProductCard,QuantityStepper,ShopProductCard}.tsx`.

Build/preview changes: `.gitignore`, `package.json`, `tsconfig.json`, `next.config.ts`, `scripts/app-build.mjs`, `scripts/brand-preview-env.mjs`, `scripts/brand-preview.test.mjs`, `scripts/build-brand-preview.mjs`, `scripts/publish-brand-preview.mjs`, `scripts/check-brand-preview.mjs`, `cloudflare/brand-preview-worker.mjs`, `wrangler.brand-preview.jsonc`, `README.md` and this handoff. The build launcher now invokes installed JavaScript entry points directly so it works on Windows. CSS source scanning and Next tracing are explicitly bounded to the app/checkout.

## Artifact and local checks

Final validation after the font/canvas correction:

| Check | Result |
| --- | --- |
| `pnpm test` | 30 passed, 0 failed; includes isolated preview protections and artifact replacement recovery |
| `pnpm typecheck` | Passed |
| `pnpm build` | Passed; existing Sentry `disableLogger` deprecation warning only |
| `pnpm build:brand-preview` | Passed; static export and portable artifact prepared |
| `pnpm check:brand-preview` | Passed; four bundled font faces, `#fafaf7`, original wordmark, asset paths and 54 SHA256 digests |
| Wrangler dry run of `dist/brand-preview/wrangler.jsonc` | Passed; ASSETS is the sole binding; no upload/deployment |
| Local HTTP smoke | Passed; page/CSS/fonts/licence served, noindex, disconnected readiness, payment POST refused |
| Browser/UI QA | Pending main controller; this agent did not browse |

The corrected portable artifact is currently served locally at `http://127.0.0.1:8794` for the main controller. Its compatibility date is pinned to `2026-09-15`, supported by the installed Wrangler/workerd runtime. Production configuration remains unchanged.

Run from this checkout with Node 22+ (validated here on Node 24) and pnpm 9:

```text
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
pnpm build:brand-preview
pnpm check:brand-preview
```

`build:brand-preview` uses a dedicated staging directory, copies no `.env` files or API routes, and permits only OS/tool lookup settings into the build environment. Payment and telemetry values are excluded. Its site metadata and unused checkout base use reserved `.invalid` hosts. The build does not run the production build adapter or production Worker. It assembles the complete artifact before swapping the generated `dist/brand-preview/` directory; a file-lock/replacement failure preserves or restores the previous bundle. Other `dist/` contents remain intact. Temporary build directories are ignored under `.brand-preview-build/`. Stop the local Wrangler preview before rebuilding on Windows because it holds the asset directory open; restart it after the artifact check passes.

The portable artifact contains:

- `public/`: static storefront, scripts, fonts, original wordmarks and generated metadata images.
- `worker.mjs`: static asset server with an explicit disconnected readiness response. Every payment API path returns 503; it has no upstream payment client or database handler.
- `wrangler.jsonc`: standalone preview config; no production routes, account ID, services, Hyperdrive, R2, credentials or build hook.
- `provenance.json`: source commit, dirty status and file SHA256 digests. This is an uncommitted working-copy build.

`wrangler.brand-preview.jsonc` is the equivalent source-checkout config. Both target only the dedicated Worker name `splitshop-brand-preview`, with Workers.dev enabled and indexing discouraged by `X-Robots-Tag`. Noindex is not access control; anyone with the eventual URL can view the demo.

Local bundle verification (does not deploy):

```text
pnpm exec wrangler deploy --config wrangler.brand-preview.jsonc --dry-run
```

Local browser handoff, if the main controller wants it:

```text
pnpm exec wrangler dev --local --config wrangler.brand-preview.jsonc --port 8794
```

Review empty cart, all three scenarios, USD/EUR/GBP/JPY, 2–6 people, quantity changes, reset, keyboard focus, narrow mobile layouts and the disconnected-checkout message. The static preview cannot exercise an SDK modal or funded order; those require a separately authorized sandbox integration.

## Exact hosted-preview prerequisites

1. Separate authorization to publish the preview. No publish command has been run.
2. An operator-selected Cloudflare account with a Workers.dev subdomain enabled. Confirm `splitshop-brand-preview` is unused or already belongs exclusively to this demo. Account/remote availability has not been queried.
3. Cloudflare CLI authentication via operator login, or `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` supplied to the future publishing process. The token needs Workers Scripts Edit for the selected account; no zone/domain permissions or payment secrets are required. Authentication presence is not proof of validity.
4. A successful build and the complete `dist/brand-preview/` artifact. Upload using **only** its `wrangler.jsonc` (or the source `wrangler.brand-preview.jsonc`), never the root production `wrangler.jsonc`, `deploy:production`, `versions upload` on `splitshop`, or the integrated main-Worker artifact.
5. The final URL will be `https://splitshop-brand-preview.<account-workers-subdomain>.workers.dev`. No custom domain or production alias is needed. Browser review by the main controller remains required.

After separate publication authorization, the exact command from this checkout is `pnpm exec wrangler deploy --config wrangler.brand-preview.jsonc`. For the portable artifact, run Wrangler against its `wrangler.jsonc` from the artifact directory. There is deliberately no preview-deploy package script or automatic deploy build hook.

## Environment inventory (names/presence only)

At inspection, `.env.local` and `.dev.vars` were absent. `.env.production` contained `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_PAY_BASE_URL` and `PLUREL_API_BASE`; their values were not used by the isolated preview build. `.env.example` and `.dev.vars.example` contain templates, not verified credentials. No matching payment, database, telemetry or Cloudflare credential names were present in the inspected process environment.

The visual preview requires **no payment credentials and no database**. No values were retrieved or changed.

For a future, separately authorized functional sandbox preview, the standalone app requires `NEXT_PUBLIC_PLUREL_MERCHANT_ID`, `NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST`, `PLUREL_SECRET_KEY_TEST`, `PLUREL_SIGNING_SECRET`, `PLUREL_WEBHOOK_SECRET_TEST`, `PLUREL_API_BASE`, `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_PAY_BASE_URL`; a dedicated PostgreSQL database with `db/migrations/0001_orders.sql`; a dedicated `HYPERDRIVE` binding for hosted production-mode execution (or `DATABASE_URL` locally); and a sandbox merchant configured for that preview origin and its `/api/webhooks/plurelpay` endpoint. The existing OpenNext deployment also needs a dedicated `NEXT_INC_CACHE_R2_BUCKET` and `WORKER_SELF_REFERENCE`. None of these resources or secrets is provisioned by the static preview configuration, and adding them does not enable its intentionally disconnected handler.
# Current revision — independent SplitShop, October 22

User explicitly removed Plurel site branding from SplitShop. The storefront now uses its own `splitshop.dev` wordmark, blue/limestone palette, system type, // favicon and social image. Plurel Pay remains identified only as the payment integration. Shared Plurel branding sync excludes this repository.

Latest local checks: 30 tests passed, TypeScript passed, isolated preview build passed, artifact check passed with 50 digests. No production merge or deployment. Older font/wordmark notes below are historical and superseded.

## Publication authorization — October 23

Connor explicitly requested deploying and publishing the SplitShop changes. This supersedes the preview-only authorization recorded above. The release targets only the existing `splitshop` Worker and its splitshop.dev/www.splitshop.dev routes. The unsupported Next 15 major has been upgraded to pinned Next 16.3.8 with explicit Webpack builds; all production credentials, storage bindings, sandbox enforcement, signatures and webhooks remain unchanged. Publication is gated on build and runtime checks. No other website or integrated merchant mount is to be deployed by this release.

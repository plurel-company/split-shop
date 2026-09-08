# Plurel Pay Demo Store

**Live sandbox:** [https://splitshop.dev](https://splitshop.dev)

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Reference implementation** for [Plurel Pay](https://plurelpay.com) merchants — a minimal Next.js storefront that shows cart signing, hosted group checkout, and webhook fulfillment. Copy patterns from this repo into your own stack; it is not a production e-commerce platform.

Official docs: [plurelpay.com/docs](https://plurelpay.com/docs)

**Repository access:** This repo is **public** — anyone can clone or fork it. Only [Plurel](https://github.com/plurel-company) organization members can push to `main`. Merchants should fork into their own GitHub account or copy files into an existing project.

## What this demonstrates

| Flow | Implementation |
| --- | --- |
| Product catalog + cart | `lib/catalog.ts`, `lib/cart.ts`, React context |
| Server-side cart signing | `POST /api/cart/sign` with `@plurel/sdk/signing` |
| Hosted checkout modal | `@plurel/react-sdk` (`PlurelButton`) |
| Test vs live credentials | Header switch + `lib/plurel-credentials.ts` |
| Order fulfillment | `POST /api/webhooks/plurelpay` on `group.funded` |
| Setup diagnostics | `GET /api/setup/status`, `POST /api/setup/verify` |

Legacy routes `/api/ante/v1/*`, `/api/webhooks/ante`, and `/api/webhooks/plurel` re-export `/api/webhooks/plurelpay` for backward compatibility.

## Quick start

```bash
cp .env.example .env.local
# Add credentials from the Plurel Pay merchant dashboard (Developers tab)

pnpm install
# In another terminal: pnpm db:dev
# Set DATABASE_URL to local Postgres, then create the schema.
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), add items, and click **Split with Plurel**.

### Sandbox test card

Use Stripe test card `4242 4242 4242 4242` inside the Plurel Pay modal. Pay every share to trigger `group.funded`.

## Architecture

```
Browser                         Next.js server                    Plurel Pay (plurelpay.com)
───────                         ──────────────                    ────────────────────────
Cart state ──► buildPlurelCart ──► POST /api/cart/sign ──► HMAC ──► PlurelButton opens modal
                     │                    │                              │
                     │                    └── registerPendingOrder       │
                     │                                                       │
Webhook poll ◄── GET /api/orders/[ref] ◄── markOrderFunded ◄── POST /api/webhooks/plurelpay
```

**Fulfill on `group.funded`**, not on client callbacks alone.

### Durable orders on Postgres

`lib/order-store.ts` persists every signed cart to Postgres before checkout opens. Cloudflare Hyperdrive provides the connection pool. Each request creates its own `pg` client. Workers releases its socket when the request ends; Node development closes it explicitly. There is no process-local order fallback.

Orders have unique, immutable references. Re-signing an identical pending cart is safe; a changed or funded cart needs a new reference. A single conditional SQL update moves an order from pending to funded, checks credential mode and payment amount, and prevents duplicate fulfillment when webhook deliveries race. Replays return the stored funded order. The signed total remains separate from the actual amount paid.

The `split_shop_orders` table uses its own namespace, so it can share a PlanetScale Postgres database with the API. Run the schema migration before starting checkout. There are no durable orders to export from the old process-local Map. Complete or reconcile in-flight checkouts before switching traffic.

See [`lib/plurel-webhook-verification.ts`](./lib/plurel-webhook-verification.ts) and [`app/api/webhooks/plurelpay/route.ts`](./app/api/webhooks/plurelpay/route.ts).

## Environment variables

Use `PLUREL_*` names in new deployments. Legacy `ANTE_*` / `NEXT_PUBLIC_ANTE_*` env vars are still read as fallbacks.

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_PLUREL_MERCHANT_ID` | Client | `plurel_merch_*` (or legacy `ante_merch_*`) |
| `NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY` | Client | **Live** publishable key |
| `NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST` | Client | **Test** publishable key |
| `NEXT_PUBLIC_SITE_URL` | Client | Origin for absolute product image URLs |
| `PLUREL_SIGNING_SECRET` | Server only | Cart HMAC signing secret |
| `PLUREL_SECRET_KEY` | Server only | **Live** secret key for session create/cancel |
| `PLUREL_SECRET_KEY_TEST` | Server only | **Test** secret key |
| `PLUREL_WEBHOOK_SECRET` | Server only | **Live** webhook secret |
| `PLUREL_WEBHOOK_SECRET_TEST` | Server only | **Test** webhook secret |

The browser SDK uses the **publishable** key. Session create/cancel is proxied through `/api/plurel/v1` and authenticated upstream with the **secret** key.

See [`.env.example`](./.env.example) for commented templates including legacy `ANTE_*` aliases.

## SDK dependency

This repo depends on the published npm packages:

```json
"@plurel/sdk": "^1.0.5",
"@plurel/react-sdk": "^1.0.5"
```

## Webhooks

The production deployment of this demo registers its webhook at:

```
https://splitshop.dev/api/webhooks/plurelpay
```

### Local dev

Plurel Pay needs a public HTTPS URL. Use a tunnel (ngrok, Cloudflare Tunnel, etc.):

```bash
cloudflared tunnel --url http://localhost:3000
```

Register `https://YOUR_TUNNEL/api/webhooks/plurelpay` in the merchant dashboard and subscribe to `group.funded`. (The legacy `/api/webhooks/plurel` and `/api/webhooks/ante` paths still work — they re-export the same handler.)

## Troubleshooting checkout

### `Invalid cart signature`

1. Use **`PLUREL_SIGNING_SECRET`** (or legacy `ANTE_SIGNING_SECRET`) — not secret or webhook keys.
2. Copy the **full** secret, redeploy after env changes.
3. Sign with **`createCartSignature`** from `@plurel/sdk/signing` (**≥ 1.0.0**).
4. Re-sign at checkout click if the cart changed after signing.

Docs: [Cart signing](https://plurelpay.com/docs/cart-signing) · [Troubleshooting](https://plurelpay.com/docs/troubleshooting)

## Project layout

```
app/
  api/plurel/v1/[...path]/route.ts   # Session API proxy (primary)
  api/ante/v1/[...path]/route.ts     # Legacy alias
  api/webhooks/plurelpay/route.ts    # Webhook fulfillment (primary)
  api/webhooks/plurel/route.ts       # Legacy alias
  api/webhooks/ante/route.ts         # Legacy alias
components/
  plurel-mode-provider.tsx           # Test/live credential switch
  checkout-panel.tsx                 # PlurelButton + cart summary
lib/
  cart.ts                            # Cart → Plurel payload builders
  plurel-credentials.ts              # PLUREL_* env with ANTE_* fallbacks
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Next.js production build |
| `pnpm build:cloudflare` | Cloudflare Worker production build |
| `pnpm preview` | Build and run in local Workers runtime |
| `pnpm deploy` | Configure Hyperdrive, build, and deploy Worker |
| `pnpm db:migrate` | Apply Postgres schema migrations |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests (`lib/*.test.ts`) |

## Links

- [Getting started](https://plurelpay.com/docs/getting-started)
- [JavaScript SDK](https://plurelpay.com/docs/sdk)
- [Cart signing](https://plurelpay.com/docs/cart-signing)
- [Webhooks](https://plurelpay.com/docs/webhooks)
- [@plurel/sdk on npm](https://www.npmjs.com/package/@plurel/sdk)

## Cloudflare deployment

The storefront runs on Cloudflare Workers with OpenNext, serves static assets through Workers Static Assets, caches Next.js output in R2, and stores orders in PlanetScale Postgres through Hyperdrive. The [OpenNext setup guide](https://opennext.js.org/cloudflare/get-started) and [Cloudflare pg guide](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/) describe the adapter and connection lifecycle.

1. Provision a PlanetScale **Postgres** database and set `DATABASE_URL` to its direct connection URL in your local environment. Keep the provider's TLS parameters.
2. Run `pnpm db:migrate`. The migration runner takes an advisory lock, applies new SQL files in one transaction, and records each applied migration.
3. Create Hyperdrive with `pnpm exec wrangler hyperdrive create split-shop --connection-string "$DATABASE_URL" --caching-disabled`. Order reads must observe funding immediately, so disable Hyperdrive query caching.
4. Create the cache bucket with `pnpm exec wrangler r2 bucket create split-shop-cache`.
5. Set `CLOUDFLARE_HYPERDRIVE_ID` to the returned ID. `pnpm cloudflare:configure` writes the ignored `wrangler.deploy.json` with the actual binding. No placeholder ID is deployed.
6. Set `NEXT_PUBLIC_*` values in the build environment. Set `PLUREL_SIGNING_SECRET`, the live/test API keys, and the live/test webhook secrets with `pnpm exec wrangler secret put NAME`. Build-time public values require rebuilding when changed.
7. Run `pnpm deploy`. Attach `splitshop.dev` as a Worker custom domain after checking the deployment. Register `https://splitshop.dev/api/webhooks/plurelpay` in the Plurel dashboard.

`pnpm db:dev` starts a local Postgres-compatible PGlite server and saves its data under the ignored `.local/postgres` directory. A standard local Postgres server works too.

The manual GitHub deployment workflow reads Cloudflare credentials from production environment secrets and the Hyperdrive ID and public build values from production environment variables. Provision the database schema and Worker secrets before running it.

For local development, `.env.local` supplies `DATABASE_URL` and credentials. For Workers preview, copy `.dev.vars.example` to `.dev.vars` and add those credentials there too. The default Wrangler config deliberately has no remote Hyperdrive binding, so local preview uses your explicit local database. Production fails closed without the generated Hyperdrive binding.

`pnpm test` exercises SQL against PGlite's Postgres engine, including duplicate webhooks, cross-client persistence, credential mode checks, underpayment, and immutable order refs. `pnpm test:cloudflare` also starts a local Postgres wire-protocol server and verifies cart signing, durable order reads, signed webhooks and replay behavior through the real Workers runtime. A successful local build does not provision a database or cut over production traffic.

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

### In-memory order store (demo only)

`lib/order-store.ts` keeps pending and funded orders in a **process-local `Map`**. That is fine for local dev and single-instance demos, but it is **not** production-safe:

- Restarts wipe all orders.
- Serverless / multi-instance hosts may route the webhook and the browser poll to **different** instances, so funding never appears in the UI.
- There is no cross-region durability or replay protection beyond idempotent webhook handling in this route.

**Production pattern:** persist orders in Postgres, Redis, or your OMS before opening checkout; fulfill inside the webhook with idempotent updates keyed by `order_ref` (and optionally `event.id`). The demo’s fail-closed checks (registered pending order, matching credential mode, minimum `total`) should carry over unchanged.

| Pattern | Demo behavior | Production recommendation |
| --- | --- | --- |
| Cart prices | Signed server-side in `/api/cart/sign` | **Always** sign carts on your server; never trust browser prices |
| Webhook auth | Verifies against **all** configured secrets | Use separate test/live webhook secrets; do not pick secret from client headers |
| Order fulfillment | Requires a registered **pending** order + valid `total` | Fail closed on unknown `order_ref` or underpayment |
| Order store | In-memory map | Durable database with idempotent webhook handling |

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
ngrok http 3000
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
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests (`lib/*.test.ts`) |

## Links

- [Getting started](https://plurelpay.com/docs/getting-started)
- [JavaScript SDK](https://plurelpay.com/docs/sdk)
- [Cart signing](https://plurelpay.com/docs/cart-signing)
- [Webhooks](https://plurelpay.com/docs/webhooks)
- [@plurel/sdk on npm](https://www.npmjs.com/package/@plurel/sdk)

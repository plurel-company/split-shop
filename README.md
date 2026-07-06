# Ante Demo Store

**Live sandbox:** [https://ante-demo-store.vercel.app](https://ante-demo-store.vercel.app)

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

**Reference implementation** for [Ante](https://splitante.com) merchants — a minimal Next.js storefront that shows cart signing, hosted group checkout, and webhook fulfillment. Copy patterns from this repo into your own stack; it is not a production e-commerce platform.

Official docs: [splitante.com/docs](https://splitante.com/docs)

**Repository access:** This repo is **public** — anyone can clone or fork it. Only [Plurel](https://github.com/plurel-company) organization members can push to `main`. Merchants should fork into their own GitHub account or copy files into an existing project.

## What this demonstrates

| Flow | Implementation |
| --- | --- |
| Product catalog + cart | `lib/catalog.ts`, `lib/cart.ts`, React context |
| Server-side cart signing | `POST /api/cart/sign` with `@splitante/sdk/signing` |
| Hosted checkout modal | `@splitante/react-sdk` (`AnteButton`) |
| Test vs live credentials | Header switch + `lib/ante-credentials.ts` |
| Order fulfillment | `POST /api/webhooks/ante` on `group.funded` |
| Setup diagnostics | `GET /api/setup/status`, `POST /api/setup/verify` |

## Quick start

```bash
cp .env.example .env.local
# Add credentials from the Ante merchant dashboard (Developers tab)

pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), add items, and click **Pay with Ante**.

### Sandbox test card

Use Stripe test card `4242 4242 4242 4242` inside the Ante modal. Pay every share to trigger `group.funded`.

## Architecture

```
Browser                         Next.js server                    Ante (splitante.com)
───────                         ──────────────                    ────────────────────
Cart state ──► buildAnteCart ──► POST /api/cart/sign ──► HMAC ──► AnteButton opens modal
                     │                    │                              │
                     │                    └── registerPendingOrder       │
                     │                                                       │
Webhook poll ◄── GET /api/orders/[ref] ◄── markOrderFunded ◄── POST /api/webhooks/ante
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

See [`lib/ante-credentials.ts`](./lib/ante-credentials.ts) (`verifyAnteWebhookSignature`) and [`app/api/webhooks/ante/route.ts`](./app/api/webhooks/ante/route.ts).

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_ANTE_MERCHANT_ID` | Client | `ante_merch_*` from dashboard |
| `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY` | Client | **Live** — `ante_pk_live_*` (Vercel Production/Preview) |
| `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST` | Client | **Test** — `ante_pk_test_*` for sandbox checkout |
| `NEXT_PUBLIC_SITE_URL` | Client | Origin for absolute product image URLs |
| `ANTE_SIGNING_SECRET` | Server only | `ante_sign_*` for cart HMAC (shared across modes) |
| `ANTE_WEBHOOK_SECRET` | Server only | **Live** — `whsec_*` for live webhook deliveries |
| `ANTE_WEBHOOK_SECRET_TEST` | Server only | **Test** — `whsec_*` for sandbox webhooks |

Optional aliases: `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE`, `ANTE_WEBHOOK_SECRET_LIVE`.

Use the **Test / Live** switch in the store header to pick which publishable key the SDK uses. Your choice is remembered in the browser.

Never commit real secrets. Never put signing or webhook secrets in client code.

See [`.env.example`](./.env.example) for commented templates.

## Webhooks (local dev)

Ante needs a public HTTPS URL. Use a tunnel (ngrok, Cloudflare Tunnel, etc.):

```bash
ngrok http 3000
```

Register `https://YOUR_TUNNEL/api/webhooks/ante` in the merchant dashboard and subscribe to `group.funded`.

## Troubleshooting checkout

### `Invalid cart signature (X-Ante-Signature)`

Ante returns this with a `details` array listing common causes. It does **not** always mean the signing secret is wrong.

1. Use **`ANTE_SIGNING_SECRET`** (`ante_sign_…`) — not `ante_sk_…` or `whsec_…`.
2. Copy the **full** secret, redeploy after env changes, and update immediately if you rotated in the dashboard.
3. Sign with **`createCartSignature`** from `@splitante/sdk/signing` (**≥ 0.1.10**). Ante always includes `fees: []` in the HMAC when the cart has no custom fees.
4. Re-sign at checkout click if the cart changed after signing.

Docs: [Cart signing](https://splitante.com/docs/cart-signing) · [Troubleshooting](https://splitante.com/docs/troubleshooting)

Use **Verify Ante credentials** on the storefront, or:

```bash
curl -X POST http://localhost:3000/api/setup/verify \
  -H "x-ante-key-mode: sandbox"
```

### `ANTE_SIGNING_SECRET is not configured`

Add the server env var on your deployment. Local dev: copy `.env.example` → `.env.local`.

## Project layout

```
app/
  page.tsx                      # Storefront shell + credential gate
  api/cart/sign/route.ts        # Cart HMAC signing
  api/setup/status/route.ts     # Env configuration check
  api/setup/verify/route.ts     # Probe Ante credentials
  api/webhooks/ante/route.ts    # Webhook verification + fulfillment
  api/orders/[orderRef]/route.ts # Order status polling
components/
  ui/format-usd.ts              # Shared USD display helper
  store/                        # Product cards (UI agents)
lib/
  types.ts                      # Shared TypeScript types
  catalog.ts                    # Demo product catalog
  cart.ts                       # Cart → Ante payload builders
  store.ts                      # Barrel re-export
  cart-signing.ts               # SDK signing re-export
  ante-credentials.ts           # Test/live env resolution
  ante-env.ts                   # Key parsing + error messages
  order-store.ts                # In-memory pending/funded orders
hooks/use-order-funding-poll.ts  # Poll until webhook marks funded
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests (`lib/*.test.ts`) |

## Deploy

Works on Vercel or any Node 20+ host. Set the same env vars in your deployment dashboard.

## Contributing

This is a reference implementation maintained by Plurel. The repo is public for **read and clone**; direct pushes to `main` are limited to Plurel org maintainers. If you are integrating Ante in your own stack, fork the repo or copy patterns into your codebase. PRs from forks that improve integration clarity are welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Links

- [Getting started](https://splitante.com/docs/getting-started)
- [JavaScript SDK](https://splitante.com/docs/sdk)
- [Cart signing](https://splitante.com/docs/cart-signing)
- [Webhooks](https://splitante.com/docs/webhooks)
- [@splitante/sdk on npm](https://www.npmjs.com/package/@splitante/sdk)

# Ante Demo Store

Minimal Next.js storefront that demonstrates [Ante](https://splitante.com) group checkout with the official SDK.

- Shop UI with a tiny product catalog and cart
- Server-side cart signing (`POST /api/cart/sign`)
- Hosted Ante checkout modal via `@splitante/react-sdk`
- Webhook handler for `group.funded` (`POST /api/webhooks/ante`)

Docs: https://splitante.com/docs

## Quick start

```bash
cp .env.example .env.local
# Add credentials from the Ante merchant dashboard (Developers tab)

npm install
npm run dev
```

Open http://localhost:3000, add items, and click **Pay with Ante**.

### Sandbox test card

Use Stripe test card `4242 4242 4242 4242` inside the Ante modal. Pay every share to trigger `group.funded`.

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_ANTE_MERCHANT_ID` | Client | `ante_merch_*` from dashboard |
| `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY` | Client | **Live** — `ante_pk_live_*` (Vercel Production/Preview) |
| `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST` | Client | **Test** — `ante_pk_test_*` for sandbox checkout |
| `ANTE_SIGNING_SECRET` | Server only | `ante_sign_*` for cart HMAC (shared across modes) |
| `ANTE_WEBHOOK_SECRET` | Server only | **Live** — `whsec_*` for live webhook deliveries |
| `ANTE_WEBHOOK_SECRET_TEST` | Server only | **Test** — `whsec_*` for sandbox webhooks |

Use the **Test / Live** switch in the store header to pick which publishable key the SDK uses. Your choice is remembered in the browser.

Never commit real secrets. Never put signing or secret keys in client code.

## Webhooks (local dev)

Ante needs a public HTTPS URL. Use a tunnel (ngrok, Cloudflare Tunnel, etc.):

```bash
ngrok http 3000
```

Register `https://YOUR_TUNNEL/api/webhooks/ante` in the merchant dashboard and subscribe to `group.funded`.

Fulfill orders on `group.funded`, not on client callbacks alone.

## Troubleshooting checkout

### `Invalid cart signature (X-Ante-Signature)`

Ante could not verify the cart HMAC. This is **not always a wrong secret** — it means the signed payload does not match what Ante expects.

1. Use **`ANTE_SIGNING_SECRET`** (`ante_sign_…` from [Developers → Signing](https://splitante.com/merchants/integration#signing)) — **not** a secret API key (`ante_sk_…`) or webhook secret (`whsec_…`).
2. Copy the **full** secret (reveal or rotate in the dashboard). If you rotated it, update Vercel with the **new** value.
3. Set it as a **server-only** env var and **redeploy** (env changes do not apply until redeployed).
4. Confirm `NEXT_PUBLIC_ANTE_MERCHANT_ID` and your publishable key are from the **same** merchant account.
5. Run this store on **`@splitante/sdk` ≥ 0.1.7** — older signing omitted `fees` from the canonical cart JSON and fails against the current Ante API even with a correct secret.

Use **Verify Ante credentials** on the storefront, or:

```bash
curl -X POST https://YOUR_STORE/api/setup/verify
```

### `ANTE_SIGNING_SECRET is not configured`

Add the server env var on your deployment. Local dev: copy `.env.example` → `.env.local`.

## Project layout

```
app/
  page.tsx                 # Storefront
  api/cart/sign/route.ts   # Cart signing
  api/setup/status/        # Env configuration check
  api/setup/verify/        # Probe Ante credentials
  api/webhooks/ante/       # Webhook verification
components/                # Cart + checkout UI
lib/store.ts               # Products and cart helpers
lib/cart-signing.ts        # HMAC signing (matches splitante.com)
```

## Deploy

Works on Vercel or any Node 20+ host. Set the same env vars in your deployment dashboard.

## Links

- [Getting started](https://splitante.com/docs/getting-started)
- [JavaScript SDK](https://splitante.com/docs/sdk)
- [Cart signing](https://splitante.com/docs/cart-signing)
- [Webhooks](https://splitante.com/docs/webhooks)
- [@splitante/sdk on npm](https://www.npmjs.com/package/@splitante/sdk)

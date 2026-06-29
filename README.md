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
| `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_TEST` | Client | `ante_pk_test_*` for sandbox checkout |
| `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY_LIVE` | Client | `ante_pk_live_*` for live checkout |
| `ANTE_SIGNING_SECRET` | Server only | `ante_sign_*` for cart HMAC (shared) |
| `ANTE_WEBHOOK_SECRET_TEST` | Server only | `whsec_*` for test webhook deliveries |
| `ANTE_WEBHOOK_SECRET_LIVE` | Server only | `whsec_*` for live webhook deliveries |

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

The store signed the cart with a different secret than Ante expects for your merchant.

1. Open [Ante → Developers → Signing](https://splitante.com/merchants/integration#signing)
2. Reveal or rotate the signing secret
3. Set `ANTE_SIGNING_SECRET` to that exact value in Vercel (or your host) — **server env only**
4. Redeploy (env changes do not apply until redeployed)
5. Confirm `NEXT_PUBLIC_ANTE_MERCHANT_ID` and `NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY` are from the **same** merchant account

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

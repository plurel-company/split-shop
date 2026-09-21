# Split Shop · the Plurel Pay convention demo

A sandbox storefront for the Plurel Pay group-checkout SDK. Choose a weekend away, a night out, or a group gift; adjust quantities and currency; preview shares for two to six people. Reset returns the demo to an empty cart. Prices and shares are illustrative. No goods ship and no real money moves.

This reference app demonstrates the **Custom SDK + Stripe** integration: a merchant-owned storefront opens Plurel's hosted checkout, with sandbox payments processed through Stripe Connect.

The catalog and split preview work without a backend. The UI enables sandbox checkout only when runtime credentials and the order table are available. Payment success appears only after a verified webhook updates the stored order.

## Production Worker

The branded storefront is Worker **`splitshop`** on `splitshop.dev` (`wrangler.jsonc`). Hosted checkout still opens on **plurelpay.com**. `plurelpay.com/demo/shop` remains the in-app demo mount on `plurelpay-web`.

The earlier integrated mount inside **plurelpay-web**:

| Surface | Mount | Owner |
| --- | --- | --- |
| Static storefront, scripts, product images | `/demo/shop/` | Main Worker Static Assets |
| Cart signatures, session proxy, order reads | `/api/demo-shop/*` | Bundled demo handler in the main Worker |
| Signed payment confirmation | `/api/demo-shop/webhooks/plurelpay` | Bundled demo handler |
| Hosted checkout and session API | Main `/pay/*`, `/api/v1/*` routes | Main Worker |
| Durable orders | `split_shop_orders` | Existing PostgreSQL through Hyperdrive |

Laptop harness: `wrangler.local.jsonc` (`split-shop-local`). Production and Workers Builds read `wrangler.jsonc` (`name`: `splitshop`). `.env.production` bakes `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_PAY_BASE_URL` into the OpenNext bundle. Workers Builds already runs `pnpm run build` then `npx wrangler deploy`. `pnpm run build` is the OpenNext Worker build (`cf-build`). Preview deploy: `npx wrangler versions upload`.

## Build the handoff

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build:integrated
pnpm test:integrated
```

`build:integrated` creates an isolated Next.js static-export staging directory without API routes, then bundles the native Request/Response route handlers separately:

| Artifact | Destination in plurelpay-web |
| --- | --- |
| `dist/cloudflare-assets/demo/shop/` | `public/demo/shop/` |
| `dist/cloudflare-handler.mjs` | `vendor/demo-shop/handler.mjs` |
| `dist/cloudflare-handler.d.mts` | `vendor/demo-shop/handler.d.mts` |
| `dist/migrations/` | Main migration runner's demo migration input |
| `dist/provenance.json` | Reviewed source commit, dirty flag, SHA256 digests |

The demo pins the reviewed, unpublished SDK 1.1.2 tarballs under `vendor/sdk/` using local `file:` dependencies. React's SDK dependency resolves to the same vendored core package. Their provenance records the SDK source commit and SHA256 checksums; builds verify those checksums. This makes CI independent of npm release timing and includes the reduced, sequential polling behavior.

The main repository's sync command copies these artifacts for review. Commit them there so remote CI requires no sibling checkout. Rebuild after source changes, then validate the final main Worker bundle. A build does not deploy or activate anything.

The handler exports:

```ts
handleDemoShopRequest(request, env, {
  fetchApi: request => mainApplication.fetch(request, env, context),
});
```

Dispatch `/api/demo-shop/` before the main application router. `fetchApi` receives a same-origin `/api/v1/` request and lets the Worker call the API in process. `pg` stays external to the artifact and is supplied by the main application. The handler requires Workers `nodejs_compat`. Request-scoped bindings use AsyncLocalStorage; concurrent demo requests cannot exchange credentials.

## Runtime configuration

The integrated handler reads only these demo-specific values, avoiding accidental use of the main application's live credentials:

| Variable/binding | Purpose |
| --- | --- |
| `DEMO_SHOP_MERCHANT_ID` | Sandbox merchant identifier |
| `DEMO_SHOP_PUBLISHABLE_KEY_TEST` | Public sandbox key |
| `DEMO_SHOP_SECRET_KEY_TEST` | Server-only sandbox session key |
| `DEMO_SHOP_SIGNING_SECRET` | Server-only cart HMAC secret |
| `DEMO_SHOP_WEBHOOK_SECRET_TEST` | Server-only sandbox webhook verification secret |
| `HYPERDRIVE` | Main Worker's existing PostgreSQL binding |
| `CLOUDFLARE_ENV` | Set to `production` in hosted production |
| `DATABASE_URL` | Local development only; never substitutes for production Hyperdrive |

`GET /api/demo-shop/setup/public` returns only the merchant ID, publishable key, and readiness. It checks the order table before enabling checkout. No credential is compiled into the static export. Live requests and live cart keys are rejected. Production exposes no setup-probe or client-log route. The session proxy denies collection listing. Successful sandbox creation sets a per-session HttpOnly, Secure-on-HTTPS, SameSite=Strict capability cookie, bound by HMAC to the session, merchant, origin and expiry (at most 24 hours). Reads and cancellation require that cookie before any merchant-authenticated API request; both recheck the stored session's sandbox environment. The same-origin SDK fetches send the cookie automatically. Copying a session ID to another browser grants no proxy access. Configure the sandbox merchant's `group.funded` webhook for `https://plurelpay.com/api/demo-shop/webhooks/plurelpay` when rollout is authorized.

Apply `db/migrations/*.sql` to the **same** PostgreSQL database before enabling sandbox checkout. The migration runner takes an advisory lock and records applied files. Signed carts get immutable order references; an identical pending cart can reuse its signature, while changed or already-funded carts require a new reference. Conditional SQL updates verify amount and credential mode and tolerate duplicate webhook delivery. There is no process-local order fallback.

## Local development

```bash
cp .env.example .env.local
pnpm install
# Separate terminal: pnpm db:dev
# Set DATABASE_URL to local PostgreSQL, then:
pnpm db:migrate
pnpm dev
```

The standalone Next.js server uses `/api/*` and sandbox `PLUREL_*` credentials from `.env.local`. Use `PLUREL_API_BASE=http://localhost:3000/api/v1` for a locally running main API, and run this storefront on another port. `NEXT_PUBLIC_SITE_URL` controls absolute catalog image URLs. The integrated export always uses the main Worker's origin for checkout.

| Command | Validation |
| --- | --- |
| `pnpm test` | PostgreSQL fulfillment, signature handling, currencies and minor-unit splits |
| `pnpm typecheck` | TypeScript |
| `pnpm build:integrated` | Static presentation and API handoff bundle |
| `pnpm test:integrated` | Bundle routing, sandbox isolation, CSRF, body limits, internal API dispatch |
| `pnpm preview:integrated` | Local static + API preview at `http://127.0.0.1:3108/demo/shop/` |
| `pnpm test:cloudflare` | Standalone workerd smoke with a local PostgreSQL wire server |

Order polling runs only while awaiting an order, pauses network requests in hidden tabs, and stops after five minutes. SDK callbacks cannot mark an order funded. A reset clears only the local demo; it does not cancel an existing hosted checkout.

[Integration docs](https://plurelpay.com/docs) · [Cart signing](https://plurelpay.com/docs/cart-signing) · [Webhooks](https://plurelpay.com/docs/webhooks)

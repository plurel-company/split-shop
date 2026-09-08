import { AsyncLocalStorage } from "node:async_hooks";

export interface DemoShopEnv {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  CLOUDFLARE_ENV?: string;
  DEMO_SHOP_MERCHANT_ID?: string;
  DEMO_SHOP_PUBLISHABLE_KEY_TEST?: string;
  DEMO_SHOP_SECRET_KEY_TEST?: string;
  DEMO_SHOP_SIGNING_SECRET?: string;
  DEMO_SHOP_WEBHOOK_SECRET_TEST?: string;
}
export interface DemoShopOptions {
  /** Dispatch this request to the main Worker's /api/v1 handler in process. */
  fetchApi?: (request: Request) => Promise<Response>;
}
type Runtime = { env: DemoShopEnv; values: Record<string, string | undefined>; origin: string; fetchApi?: DemoShopOptions["fetchApi"] };
const runtime = new AsyncLocalStorage<Runtime>();
export function getDemoRuntime() { return runtime.getStore(); }
export function withDemoRuntime<T>(env: DemoShopEnv, origin: string, options: DemoShopOptions, callback: () => T): T {
  // Only sandbox credentials enter the public demo. Never borrow the main app's live keys.
  return runtime.run({ env, origin, fetchApi: options.fetchApi, values: {
    NEXT_PUBLIC_PLUREL_MERCHANT_ID: env.DEMO_SHOP_MERCHANT_ID,
    NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST: env.DEMO_SHOP_PUBLISHABLE_KEY_TEST,
    PLUREL_SECRET_KEY_TEST: env.DEMO_SHOP_SECRET_KEY_TEST,
    PLUREL_SIGNING_SECRET: env.DEMO_SHOP_SIGNING_SECRET,
    PLUREL_WEBHOOK_SECRET_TEST: env.DEMO_SHOP_WEBHOOK_SECRET_TEST,
  } }, callback);
}

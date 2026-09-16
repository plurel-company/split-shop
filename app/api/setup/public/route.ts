import { merchantId, resolvePublishableKey, resolveSecretKey, signingSecret, resolveWebhookSecret } from "@/lib/plurel-credentials";
import { withOrderDatabase } from "@/lib/order-database";
export async function GET() {
  const id = merchantId();
  const key = resolvePublishableKey("sandbox");
  let ready = Boolean(id && /^plurel_pk_test_/.test(key) && /^plurel_sk_test_/.test(resolveSecretKey("sandbox")) && signingSecret() && resolveWebhookSecret("sandbox"));
  if (ready) {
    try { await withOrderDatabase(query => query("SELECT 1 FROM split_shop_orders LIMIT 0", [])); }
    catch { ready = false; }
  }
  return Response.json({ merchantId: id, publishableKey: key, ready }, { headers: { "cache-control": "no-store" } });
}

/** POST /api/cart/sign — HMAC-sign cart with PLUREL_SIGNING_SECRET; registers pending order. */
import type { Cart } from "@plurel/sdk";

import {
  PLUREL_KEY_MODE_HEADER,
  credentialModeFromPublishableKey,
  keyModeMatches,
  parsePlurelCredentialMode,
} from "@/lib/plurel-credential-mode";
import { signingSecret } from "@/lib/plurel-credentials";
import { createCartSignature } from "@/lib/cart-signing";
import { registerPendingOrder } from "@/lib/order-store";

function isSigningSecret(value: string): boolean {
  return value.startsWith("plurel_sign_") || value.startsWith("ante_sign_");
}

/** Map signed Plurel cart → in-memory pending order (keyed by metadata.order_ref). */
function pendingFromCart(
  cart: Cart,
  credentialMode: ReturnType<typeof parsePlurelCredentialMode>,
) {
  const orderRef = cart.metadata?.order_ref;
  if (!orderRef) return null;

  const lines = cart.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    image_url: "image_url" in item && typeof item.image_url === "string" ? item.image_url : undefined,
  }));

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unit_price, 0);
  const tax = cart.tax ?? 0;
  const shipping = cart.shipping ?? 0;
  const fees = cart.fees?.map((fee) => ({
    id: fee.id,
    label: fee.label,
    amount: fee.amount,
  }));

  return {
    orderRef,
    lines,
    ...(fees?.length ? { fees } : {}),
    subtotal,
    tax,
    shipping,
    total: cart.total,
    createdAt: Date.now(),
    credentialMode,
  };
}

export async function POST(req: Request) {
  const secret = signingSecret();
  if (!secret) {
    return Response.json(
      {
        error:
          "PLUREL_SIGNING_SECRET (or ANTE_SIGNING_SECRET) is not configured on this deployment. Copy your signing secret from Plurel Pay → Developers → Signing and add it in Vercel/host env vars.",
      },
      { status: 503 },
    );
  }

  if (!isSigningSecret(secret)) {
    return Response.json(
      {
        error:
          "Signing secret looks invalid (expected plurel_sign_… or ante_sign_…). Copy the full value from Plurel Pay → Developers → Signing.",
      },
      { status: 500 },
    );
  }

  let body: { cart?: Cart; publishableKey?: string };
  try {
    body = (await req.json()) as { cart?: Cart; publishableKey?: string };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cart, publishableKey } = body;
  if (!cart?.total || !cart.currency || !Array.isArray(cart.items) || cart.items.length === 0) {
    return Response.json({ error: "Invalid cart" }, { status: 400 });
  }

  const key = publishableKey?.trim();
  if (!key) {
    return Response.json({ error: "publishableKey is required" }, { status: 400 });
  }

  try {
    const signature = createCartSignature(cart, secret);
    const credentialMode = credentialModeFromPublishableKey(key);
    const headerMode = parsePlurelCredentialMode(
      req.headers.get(PLUREL_KEY_MODE_HEADER) ?? req.headers.get("x-ante-key-mode"),
    );
    if (!keyModeMatches(headerMode, key)) {
      return Response.json({ error: "Publishable key does not match x-plurel-key-mode" }, { status: 400 });
    }
    const pending = pendingFromCart(cart, credentialMode);
    if (pending) {
      registerPendingOrder(pending);
    }
    return Response.json({ signature });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign cart";
    return Response.json({ error: message }, { status: 400 });
  }
}

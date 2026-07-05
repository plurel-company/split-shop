/** POST /api/cart/sign — HMAC-sign cart with ANTE_SIGNING_SECRET; registers pending order. */
import type { Cart } from "@splitante/sdk";

import {
  ANTE_KEY_MODE_HEADER,
  parseAnteCredentialMode,
} from "@/lib/ante-credentials";
import { createCartSignature } from "@/lib/cart-signing";
import { registerPendingOrder } from "@/lib/order-store";

/** Map signed Ante cart → in-memory pending order (keyed by metadata.order_ref). */
function pendingFromCart(
  cart: Cart,
  credentialMode: ReturnType<typeof parseAnteCredentialMode>,
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
  const signingSecret = process.env.ANTE_SIGNING_SECRET?.trim();
  if (!signingSecret) {
    return Response.json(
      {
        error:
          "ANTE_SIGNING_SECRET is not configured on this deployment. Copy your signing secret from Ante → Developers → Signing and add it in Vercel/host env vars.",
      },
      { status: 503 },
    );
  }

  if (!signingSecret.startsWith("ante_sign_")) {
    return Response.json(
      {
        error:
          "ANTE_SIGNING_SECRET looks invalid (expected ante_sign_…). Copy the full value from Ante → Developers → Signing.",
      },
      { status: 500 },
    );
  }

  let body: { cart?: Cart };
  try {
    body = (await req.json()) as { cart?: Cart };
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { cart } = body;
  if (!cart?.total || !cart.currency || !Array.isArray(cart.items) || cart.items.length === 0) {
    return Response.json({ error: "Invalid cart" }, { status: 400 });
  }

  try {
    const signature = createCartSignature(cart, signingSecret);
    const credentialMode = parseAnteCredentialMode(req.headers.get(ANTE_KEY_MODE_HEADER));
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

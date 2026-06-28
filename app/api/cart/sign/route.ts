import type { Cart } from "@splitante/sdk";

import { createCartSignature } from "@/lib/cart-signing";

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
    return Response.json({ signature });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sign cart";
    return Response.json({ error: message }, { status: 400 });
  }
}

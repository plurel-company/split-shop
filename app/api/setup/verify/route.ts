import type { Cart } from "@splitante/sdk";

import { createCartSignature } from "@/lib/cart-signing";

const PROBE_CART: Cart = {
  total: 100,
  currency: "usd",
  items: [{ id: "probe", name: "Setup probe", quantity: 1, unit_price: 100 }],
  metadata: { order_ref: "setup-probe" },
};

/** Signs a probe cart and checks credentials against splitante.com without leaving a session open. */
export async function POST() {
  const merchantId = process.env.NEXT_PUBLIC_ANTE_MERCHANT_ID?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY?.trim();
  const signingSecret = process.env.ANTE_SIGNING_SECRET?.trim();

  if (!merchantId || !publishableKey || !signingSecret) {
    return Response.json(
      {
        ok: false,
        error: "Missing merchant ID, publishable key, or ANTE_SIGNING_SECRET.",
      },
      { status: 503 },
    );
  }

  const signature = createCartSignature(PROBE_CART, signingSecret);

  const response = await fetch("https://splitante.com/api/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publishableKey}`,
      "X-Merchant-ID": merchantId,
      "Content-Type": "application/json",
      "X-Ante-Signature": signature,
    },
    body: JSON.stringify({
      cart: PROBE_CART,
      group_config: { min_size: 2, max_size: 2 },
    }),
  });

  let payload: { error?: string; session_id?: string } | null = null;
  try {
    payload = (await response.json()) as { error?: string; session_id?: string };
  } catch {
    payload = null;
  }

  if (response.ok) {
    if (payload?.session_id) {
      await fetch(
        `https://splitante.com/api/v1/sessions/${encodeURIComponent(payload.session_id)}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publishableKey}`,
            "X-Merchant-ID": merchantId,
            "Content-Type": "application/json",
          },
        },
      ).catch(() => undefined);
    }

    return Response.json({
      ok: true,
      message: "Credentials and cart signing are configured correctly.",
    });
  }

  const apiError = payload?.error ?? `Ante API error (${response.status})`;

  if (apiError.includes("Invalid cart signature")) {
    return Response.json(
      {
        ok: false,
        error:
          "Signing secret mismatch: ANTE_SIGNING_SECRET on this deployment does not match the Ante merchant dashboard. Open Developers → Signing, reveal/copy the secret, update Vercel env vars, and redeploy.",
        detail: apiError,
      },
      { status: 403 },
    );
  }

  if (response.status === 401 || apiError.includes("API key")) {
    return Response.json(
      {
        ok: false,
        error:
          "Publishable key or merchant ID is invalid. Confirm NEXT_PUBLIC_ANTE_MERCHANT_ID and NEXT_PUBLIC_ANTE_PUBLISHABLE_KEY from the same sandbox merchant.",
        detail: apiError,
      },
      { status: 403 },
    );
  }

  return Response.json({ ok: false, error: apiError, detail: apiError }, { status: response.status });
}

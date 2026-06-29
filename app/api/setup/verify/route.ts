import type { Cart } from "@splitante/sdk";

import {
  merchantId,
  modeLabel,
  parseAnteCredentialMode,
  resolvePublishableKey,
  signingSecret,
  ANTE_KEY_MODE_HEADER,
} from "@/lib/ante-credentials";
import { explainAnteApiError } from "@/lib/ante-env";
import { createCartSignature } from "@/lib/cart-signing";

const PROBE_CART: Cart = {
  total: 1000,
  currency: "usd",
  items: [{ id: "probe", name: "Setup probe", quantity: 1, unit_price: 1000 }],
  metadata: { order_ref: "setup-probe" },
};

/** Signs a probe cart and checks credentials against splitante.com without leaving a session open. */
export async function POST(req: Request) {
  const mode = parseAnteCredentialMode(req.headers.get(ANTE_KEY_MODE_HEADER));
  const id = merchantId();
  const publishableKey = resolvePublishableKey(mode);
  const secret = signingSecret();

  if (!id || !publishableKey || !secret) {
    return Response.json(
      {
        ok: false,
        error: `Missing merchant ID, ${modeLabel(mode).toLowerCase()} publishable key, or ANTE_SIGNING_SECRET.`,
      },
      { status: 503 },
    );
  }

  const signature = createCartSignature(PROBE_CART, secret);

  const response = await fetch("https://splitante.com/api/v1/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${publishableKey}`,
      "X-Merchant-ID": id,
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
            "X-Merchant-ID": id,
            "Content-Type": "application/json",
          },
        },
      ).catch(() => undefined);
    }

    return Response.json({
      ok: true,
      message: `${modeLabel(mode)} credentials and cart signing are configured correctly.`,
    });
  }

  const apiError = payload?.error ?? `Ante API error (${response.status})`;

  return Response.json(
    {
      ok: false,
      error: explainAnteApiError(apiError, response.status),
      detail: apiError,
      anteStatus: response.status,
    },
    { status: response.status >= 500 ? 503 : 403 },
  );
}

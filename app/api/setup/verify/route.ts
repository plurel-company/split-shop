/** POST /api/setup/verify — probe cart signing + Plurel Pay session API without leaving an open session. */
import type { Cart } from "@plurel/sdk";

import {
  merchantId,
  modeLabel,
  parseCredentialModeFromRequest,
  signingSecret,
} from "@/lib/plurel-credentials";
import { PLUREL_API_BASE, secretKeyForSessions } from "@/lib/plurel-upstream";
import { explainPlurelApiError } from "@/lib/plurel-env";
import { createCartSignature } from "@/lib/cart-signing";

const PROBE_CART: Cart = {
  total: 1000,
  currency: "usd",
  items: [{ id: "probe", name: "Setup probe", quantity: 1, unit_price: 1000 }],
  metadata: { order_ref: "setup-probe" },
};

export async function POST(req: Request) {
  const mode = parseCredentialModeFromRequest(req);
  const id = merchantId();
  const secret = signingSecret();

  if (!id || !secret) {
    return Response.json(
      {
        ok: false,
        error: `Missing merchant ID or PLUREL_SIGNING_SECRET (or ANTE_SIGNING_SECRET).`,
      },
      { status: 503 },
    );
  }

  let apiKey: string;
  try {
    apiKey = secretKeyForSessions(mode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Secret API key not configured";
    return Response.json({ ok: false, error: message }, { status: 503 });
  }

  const signature = createCartSignature(PROBE_CART, secret);

  const response = await fetch(`${PLUREL_API_BASE}/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Merchant-ID": id,
      "Content-Type": "application/json",
      "X-Plurel-Signature": signature,
      "X-Ante-Signature": signature,
    },
    body: JSON.stringify({
      cart: PROBE_CART,
      group_config: { min_size: 2, max_size: 2 },
    }),
  });

  let payload: { error?: string; session_id?: string; details?: string[] } | null = null;
  try {
    payload = (await response.json()) as { error?: string; session_id?: string };
  } catch {
    payload = null;
  }

  if (response.ok) {
    if (payload?.session_id) {
      await fetch(
        `${PLUREL_API_BASE}/sessions/${encodeURIComponent(payload.session_id)}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
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

  const apiError = payload?.error ?? `Plurel Pay API error (${response.status})`;

  return Response.json(
    {
      ok: false,
      error: explainPlurelApiError(apiError, response.status, payload?.details),
      detail: apiError,
      details: payload?.details,
      plurelStatus: response.status,
    },
    { status: response.status >= 500 ? 503 : 403 },
  );
}

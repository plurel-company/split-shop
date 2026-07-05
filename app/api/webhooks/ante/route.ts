/** POST /api/webhooks/ante — verify Ante webhook signature; fulfill on group.funded. */
import { verifyWebhookSignature } from "@splitante/sdk/signing";

import { parseAnteCredentialMode, resolveWebhookSecret } from "@/lib/ante-credentials";
import { getOrder, markOrderFunded } from "@/lib/order-store";

type AnteWebhookEvent = {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
};

function webhookModeFromRequest(request: Request): "sandbox" | "live" {
  return parseAnteCredentialMode(request.headers.get("x-ante-key-mode"));
}

export async function POST(req: Request) {
  const mode = webhookModeFromRequest(req);
  const secret = resolveWebhookSecret(mode);
  if (!secret) {
    return Response.json({ error: "No webhook secret configured for mode" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("ante-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, secret, signatureHeader)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as AnteWebhookEvent;

  if (event.type === "group.funded") {
    const orderRef =
      typeof event.data.order_ref === "string" ? event.data.order_ref : undefined;
    const sessionId =
      typeof event.data.session_id === "string" ? event.data.session_id : "";
    const groupId =
      typeof event.data.group_id === "string" ? event.data.group_id : sessionId;
    const totalPaid = typeof event.data.total === "number" ? event.data.total : 0;

    if (!orderRef) {
      console.error("[ante webhook] group.funded missing order_ref", event.data);
      return Response.json({ error: "Missing order_ref" }, { status: 400 });
    }

    const pending = getOrder(orderRef);
    if (pending?.status === "pending" && totalPaid < pending.total) {
      return Response.json(
        { error: "Funded total is below order amount" },
        { status: 400 },
      );
    }

    const funded = markOrderFunded({
      orderRef,
      sessionId,
      groupId,
      totalPaid,
      fundedAt: Date.now(),
    });

    console.info("[ante webhook] group.funded", {
      orderRef,
      sessionId,
      totalPaid,
      mode,
    });

    return Response.json({ received: true, order: funded });
  }

  console.info("[ante webhook]", event.type, event.data);
  return Response.json({ received: true });
}

export async function GET() {
  return Response.json({
    message: "Ante webhook endpoint. POST signed group.funded events from the merchant dashboard.",
  });
}

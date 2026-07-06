/** POST /api/webhooks/ante — verify Ante webhook signature; fulfill on group.funded. */
import {
  listWebhookSecrets,
  parseAnteCredentialMode,
  verifyAnteWebhookSignature,
} from "@/lib/ante-credentials";
import { fulfillGroupFunded } from "@/lib/webhook-fulfillment";

type AnteWebhookEvent = {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
};

export async function POST(req: Request) {
  if (listWebhookSecrets().length === 0) {
    return Response.json({ error: "No webhook secret configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("ante-signature") ?? "";

  const verifiedMode = verifyAnteWebhookSignature(rawBody, signatureHeader);
  if (!verifiedMode) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as AnteWebhookEvent;
  const modeHint = parseAnteCredentialMode(req.headers.get("x-ante-key-mode"));

  if (event.type === "group.funded") {
    const result = fulfillGroupFunded(event, verifiedMode);

    if (!result.ok) {
      if (result.status === 400 && result.error === "Missing order_ref") {
        console.error("[ante webhook] group.funded missing order_ref", event.data);
      } else if (result.status === 400 && result.error === "Missing or invalid total") {
        console.error("[ante webhook] group.funded missing or invalid total", event.data);
      } else if (result.status === 404) {
        console.error("[ante webhook] group.funded unknown order_ref", {
          orderRef: event.data.order_ref,
        });
      } else if (result.status === 401) {
        console.error("[ante webhook] group.funded credential mode mismatch", {
          orderRef: event.data.order_ref,
          verifiedMode,
        });
      }
      return Response.json({ error: result.error }, { status: result.status });
    }

    if (result.duplicate) {
      console.info("[ante webhook] group.funded duplicate", {
        orderRef: result.order.orderRef,
        sessionId: result.order.sessionId,
        modeHint,
        verifiedMode,
      });
    } else {
      console.info("[ante webhook] group.funded", {
        orderRef: result.order.orderRef,
        sessionId: result.order.sessionId,
        totalPaid: result.order.totalPaid,
        modeHint,
      });
    }

    return Response.json({ received: true, order: result.order });
  }

  console.info("[ante webhook]", event.type, event.data);
  return Response.json({ received: true });
}

export function GET() {
  return new Response(null, { status: 405, headers: { Allow: "POST" } });
}

/** POST /api/webhooks/ante — verify Ante webhook signature; fulfill on group.funded. */
import {
  listWebhookSecrets,
  parseAnteCredentialMode,
  verifyAnteWebhookSignature,
} from "@/lib/ante-credentials";
import { getOrder, markOrderFunded } from "@/lib/order-store";

type AnteWebhookEvent = {
  id: string;
  type: string;
  created_at: string;
  data: Record<string, unknown>;
};

function parseFundedTotal(data: Record<string, unknown>): number | null {
  const total = data.total;
  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return total;
}

export async function POST(req: Request) {
  if (listWebhookSecrets().length === 0) {
    return Response.json({ error: "No webhook secret configured" }, { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get("ante-signature") ?? "";

  if (!verifyAnteWebhookSignature(rawBody, signatureHeader)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as AnteWebhookEvent;
  const modeHint = parseAnteCredentialMode(req.headers.get("x-ante-key-mode"));

  if (event.type === "group.funded") {
    const orderRef =
      typeof event.data.order_ref === "string" ? event.data.order_ref : undefined;
    const sessionId =
      typeof event.data.session_id === "string" ? event.data.session_id : "";
    const groupId =
      typeof event.data.group_id === "string" ? event.data.group_id : sessionId;
    const totalPaid = parseFundedTotal(event.data);

    if (!orderRef) {
      console.error("[ante webhook] group.funded missing order_ref", event.data);
      return Response.json({ error: "Missing order_ref" }, { status: 400 });
    }

    if (totalPaid === null) {
      console.error("[ante webhook] group.funded missing or invalid total", event.data);
      return Response.json({ error: "Missing or invalid total" }, { status: 400 });
    }

    const existing = getOrder(orderRef);
    if (!existing) {
      console.error("[ante webhook] group.funded unknown order_ref", { orderRef });
      return Response.json({ error: "Unknown order_ref" }, { status: 404 });
    }

    if (existing.status === "funded") {
      console.info("[ante webhook] group.funded duplicate", {
        orderRef,
        sessionId,
        modeHint,
      });
      return Response.json({ received: true, order: existing });
    }

    if (totalPaid < existing.total) {
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

    if (!funded) {
      return Response.json({ error: "Order is not pending fulfillment" }, { status: 409 });
    }

    console.info("[ante webhook] group.funded", {
      orderRef,
      sessionId,
      totalPaid,
      modeHint,
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

/** group.funded webhook fulfillment — extracted for unit tests. */
import type { AnteCredentialMode } from "@/lib/ante-credential-mode";
import {
  getOrder,
  markOrderFunded,
  type FundedOrder,
} from "@/lib/order-store";

export type GroupFundedEvent = {
  type: string;
  data: Record<string, unknown>;
};

export type FulfillGroupFundedResult =
  | { ok: true; status: 200; order: FundedOrder; duplicate: boolean }
  | { ok: false; status: 400 | 401 | 404 | 409; error: string };

function parseFundedTotal(data: Record<string, unknown>): number | null {
  const total = data.total;
  if (typeof total !== "number" || !Number.isFinite(total) || total <= 0) {
    return null;
  }
  return total;
}

export function fulfillGroupFunded(
  event: GroupFundedEvent,
  verifiedMode: AnteCredentialMode,
): FulfillGroupFundedResult {
  const orderRef = typeof event.data.order_ref === "string" ? event.data.order_ref : undefined;
  const sessionId = typeof event.data.session_id === "string" ? event.data.session_id : "";
  const groupId =
    typeof event.data.group_id === "string" ? event.data.group_id : sessionId;
  const totalPaid = parseFundedTotal(event.data);

  if (!orderRef) {
    return { ok: false, status: 400, error: "Missing order_ref" };
  }

  if (totalPaid === null) {
    return { ok: false, status: 400, error: "Missing or invalid total" };
  }

  const existing = getOrder(orderRef);
  if (!existing) {
    return { ok: false, status: 404, error: "Unknown order_ref" };
  }

  if (existing.status === "funded") {
    return { ok: true, status: 200, order: existing, duplicate: true };
  }

  if (existing.credentialMode !== verifiedMode) {
    return { ok: false, status: 401, error: "Webhook credential mode mismatch" };
  }

  if (totalPaid < existing.total) {
    return { ok: false, status: 400, error: "Funded total is below order amount" };
  }

  const funded = markOrderFunded({
    orderRef,
    sessionId,
    groupId,
    totalPaid,
    fundedAt: Date.now(),
  });

  if (!funded) {
    return { ok: false, status: 409, error: "Order is not pending fulfillment" };
  }

  return { ok: true, status: 200, order: funded, duplicate: false };
}

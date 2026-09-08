/** group.funded webhook fulfillment — extracted for unit tests. */
import type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
import {
  orderStore,
  type OrderStore,
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
  if (typeof total !== "number" || !Number.isSafeInteger(total) || total <= 0) {
    return null;
  }
  return total;
}

function replayResult(
  order: FundedOrder,
  sessionId: string,
  groupId: string,
  totalPaid: number,
): FulfillGroupFundedResult {
  if (order.sessionId !== sessionId || order.groupId !== groupId || order.totalPaid !== totalPaid) {
    return { ok: false, status: 409, error: "Funded order payment identity mismatch" };
  }
  return { ok: true, status: 200, order, duplicate: true };
}

export async function fulfillGroupFunded(
  event: GroupFundedEvent,
  verifiedMode: PlurelCredentialMode,
  store: OrderStore = orderStore,
): Promise<FulfillGroupFundedResult> {
  const orderRef = typeof event.data.order_ref === "string" ? event.data.order_ref : undefined;
  const sessionId = typeof event.data.session_id === "string" ? event.data.session_id : "";
  const groupId =
    typeof event.data.group_id === "string" ? event.data.group_id : sessionId;
  const totalPaid = parseFundedTotal(event.data);

  if (!orderRef) {
    return { ok: false, status: 400, error: "Missing order_ref" };
  }

  if (!sessionId.trim() || !groupId.trim()) {
    return { ok: false, status: 400, error: "Missing payment session or group identity" };
  }

  if (totalPaid === null) {
    return { ok: false, status: 400, error: "Missing or invalid total" };
  }

  const existing = await store.getOrder(orderRef);
  if (!existing) {
    return { ok: false, status: 404, error: "Unknown order_ref" };
  }

  if (existing.credentialMode !== verifiedMode) {
    return { ok: false, status: 401, error: "Webhook credential mode mismatch" };
  }

  if (existing.status === "funded") {
    return replayResult(existing, sessionId, groupId, totalPaid);
  }

  if (totalPaid < existing.total) {
    return { ok: false, status: 400, error: "Funded total is below order amount" };
  }

  const funded = await store.markOrderFunded({
    orderRef,
    sessionId,
    groupId,
    totalPaid,
    fundedAt: Date.now(),
    credentialMode: verifiedMode,
  });

  if (!funded) {
    // A competing webhook may have funded this order after the initial read.
    const current = await store.getOrder(orderRef);
    if (current?.status === "funded" && current.credentialMode === verifiedMode) {
      return replayResult(current, sessionId, groupId, totalPaid);
    }
    return { ok: false, status: 409, error: "Order is not pending fulfillment" };
  }

  return { ok: true, status: 200, order: funded, duplicate: false };
}

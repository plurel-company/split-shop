/** In-memory order ledger for demo fulfillment (pending → funded via webhook). */
import type { AnteCredentialMode } from "@/lib/ante-credentials";
import type { CartLine } from "@/lib/types";

export type OrderFee = {
  id: string;
  label: string;
  amount: number;
};

export type PendingOrder = {
  orderRef: string;
  lines: CartLine[];
  fees?: OrderFee[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: number;
  /** Credential mode active when the cart was signed — webhook must match. */
  credentialMode: AnteCredentialMode;
};

export type FundedOrder = PendingOrder & {
  status: "funded";
  groupId: string;
  sessionId: string;
  fundedAt: number;
  totalPaid: number;
};

export type OrderRecord = PendingOrder & { status: "pending" } | FundedOrder;

type OrderStoreState = {
  pending: Map<string, PendingOrder>;
  funded: Map<string, FundedOrder>;
};

const STORE_KEY = "__ante_demo_order_store__";

function getStore(): OrderStoreState {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: OrderStoreState;
  };
  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = {
      pending: new Map(),
      funded: new Map(),
    };
  }
  return globalStore[STORE_KEY];
}

export function registerPendingOrder(order: PendingOrder): void {
  const store = getStore();
  store.pending.set(order.orderRef, order);
}

export function markOrderFunded(input: {
  orderRef: string;
  sessionId: string;
  groupId: string;
  totalPaid: number;
  fundedAt: number;
}): FundedOrder | null {
  const store = getStore();
  const pending = store.pending.get(input.orderRef);
  if (!pending) return null;

  const funded: FundedOrder = {
    ...pending,
    status: "funded",
    sessionId: input.sessionId,
    groupId: input.groupId,
    fundedAt: input.fundedAt,
    totalPaid: input.totalPaid,
    total: input.totalPaid,
  };

  store.funded.set(input.orderRef, funded);
  store.pending.delete(input.orderRef);
  return funded;
}

export function getOrder(orderRef: string): OrderRecord | null {
  const store = getStore();
  const funded = store.funded.get(orderRef);
  if (funded) return funded;
  const pending = store.pending.get(orderRef);
  if (pending) return { ...pending, status: "pending" };
  return null;
}

export function listFundedOrderRefs(): string[] {
  return [...getStore().funded.keys()];
}

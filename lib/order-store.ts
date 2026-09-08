/** Durable Postgres order ledger shared by every Worker instance. */
import type { PlurelCredentialMode } from "@/lib/plurel-credential-mode";
import type { CurrencyCode } from "./currency";
import type { CartLine } from "@/lib/types";

export type OrderFee = {
  id: string;
  label: string;
  amount: number;
};

export type PendingOrder = {
  orderRef: string;
  currency: CurrencyCode;
  lines: CartLine[];
  fees?: OrderFee[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  createdAt: number;
  /** Credential mode active when the cart was signed — webhook must match. */
  credentialMode: PlurelCredentialMode;
};

export type FundedOrder = PendingOrder & {
  status: "funded";
  groupId: string;
  sessionId: string;
  fundedAt: number;
  totalPaid: number;
};

export type OrderRecord = PendingOrder & { status: "pending" } | FundedOrder;

export type FundOrderInput = {
  orderRef: string;
  sessionId: string;
  groupId: string;
  totalPaid: number;
  fundedAt: number;
  credentialMode: PlurelCredentialMode;
};

export interface OrderStore {
  registerPendingOrder(order: PendingOrder): Promise<void>;
  getOrder(orderRef: string): Promise<OrderRecord | null>;
  markOrderFunded(input: FundOrderInput): Promise<FundedOrder | null>;
}

export class OrderConflictError extends Error {
  constructor() {
    super("This order reference is already registered with different cart details or is funded.");
  }
}

export type OrderQuery = (sql: string, parameters: unknown[]) => Promise<{ rows: { record: OrderRecord }[] }>;

/** Parameterized Postgres queries shared by Workers and database integration tests. */
export function createPostgresOrderStore(query: OrderQuery): OrderStore {
  return {
    async registerPendingOrder(order) {
      const result = await query(
        `INSERT INTO split_shop_orders (order_ref, record)
         VALUES ($1, $2::jsonb)
         ON CONFLICT (order_ref) DO UPDATE SET updated_at = split_shop_orders.updated_at
         WHERE split_shop_orders.record->>'status' = 'pending'
           AND split_shop_orders.record - 'createdAt' = EXCLUDED.record - 'createdAt'
         RETURNING record`,
        [order.orderRef, JSON.stringify({ ...order, status: "pending" })],
      );
      if (result.rows.length === 0) throw new OrderConflictError();
    },
    async getOrder(orderRef) {
      const result = await query("SELECT record FROM split_shop_orders WHERE order_ref = $1", [orderRef]);
      return result.rows[0]?.record ?? null;
    },
    async markOrderFunded(input) {
      const result = await query(
        `UPDATE split_shop_orders
         SET record = record || $2::jsonb, updated_at = now()
         WHERE order_ref = $1 AND record->>'status' = 'pending'
           AND record->>'credentialMode' = $3
           AND (record->>'total')::numeric <= $4
         RETURNING record`,
        [input.orderRef, JSON.stringify({
          status: "funded", sessionId: input.sessionId, groupId: input.groupId,
          fundedAt: input.fundedAt, totalPaid: input.totalPaid,
        }), input.credentialMode, input.totalPaid],
      );
      return result.rows[0]?.record as FundedOrder | undefined ?? null;
    },
  };
}

async function withStore<T>(callback: (store: OrderStore) => Promise<T>): Promise<T> {
  const { withOrderDatabase } = await import("./order-database");
  return withOrderDatabase((query) => callback(createPostgresOrderStore(query)));
}

export const registerPendingOrder: OrderStore["registerPendingOrder"] = (order) =>
  withStore((store) => store.registerPendingOrder(order));
export const getOrder: OrderStore["getOrder"] = (orderRef) => withStore((store) => store.getOrder(orderRef));
export const markOrderFunded: OrderStore["markOrderFunded"] = (input) => withStore((store) => store.markOrderFunded(input));

export const orderStore: OrderStore = { registerPendingOrder, getOrder, markOrderFunded };

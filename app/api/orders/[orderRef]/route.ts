/** GET /api/orders/[orderRef] — poll pending vs funded status (durable Postgres store). */
import { getOrder } from "@/lib/order-store";

type RouteParams = { params: Promise<{ orderRef: string }> };

export async function GET(_req: Request, { params }: RouteParams) {
  const { orderRef } = await params;
  const order = await getOrder(orderRef);

  if (!order) {
    return Response.json({ status: "not_found" }, { status: 404 });
  }

  if (order.status === "funded") {
    return Response.json({ status: "funded", order });
  }

  return Response.json({ status: "pending", order });
}

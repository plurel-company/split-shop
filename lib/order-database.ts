import { Client } from "pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { OrderQuery } from "./order-store";

/** Never retain database clients across Worker requests. Hyperdrive owns the pool. */
export async function withOrderDatabase<T>(callback: (query: OrderQuery) => Promise<T>): Promise<T> {
  let connectionString: string | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    connectionString = env.HYPERDRIVE?.connectionString;
  } catch {
    // Plain Node.js tools and local Next.js development can use DATABASE_URL.
  }
  if (!connectionString && process.env.CLOUDFLARE_ENV !== "production") {
    connectionString = process.env.DATABASE_URL;
  }
  if (!connectionString) throw new Error("Order database is not configured. Bind HYPERDRIVE to Postgres.");
  const client = new Client({ connectionString, connectionTimeoutMillis: 10_000, query_timeout: 10_000 });
  const inWorker = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
  try {
    await client.connect();
    return await callback((sql, parameters) => client.query(sql, parameters));
  } finally {
    // Workers dispose request-scoped connections. Awaiting pg's shutdown can hang
    // the response on Workers sockets; Node development still needs explicit cleanup.
    if (!inWorker) await client.end();
  }
}

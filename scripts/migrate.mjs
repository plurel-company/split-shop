import { readdir, readFile } from "node:fs/promises";
import { Client } from "pg";

if (!process.env.DATABASE_URL) throw new Error("Set DATABASE_URL to the direct Postgres migration connection URL.");
const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(781285120)");
  await client.query("CREATE TABLE IF NOT EXISTS split_shop_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  const directory = new URL("../db/migrations/", import.meta.url);
  for (const name of (await readdir(directory)).filter((name) => name.endsWith(".sql")).sort()) {
    const existing = await client.query("SELECT 1 FROM split_shop_migrations WHERE name = $1", [name]);
    if (existing.rowCount) continue;
    await client.query(await readFile(new URL(name, directory), "utf8"));
    await client.query("INSERT INTO split_shop_migrations (name) VALUES ($1)", [name]);
    console.log(`Applied ${name}`);
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}

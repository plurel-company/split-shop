import { readFile, writeFile } from "node:fs/promises";

const id = process.env.CLOUDFLARE_HYPERDRIVE_ID;
if (!id || !/^[a-f0-9]{32}$/i.test(id)) {
  throw new Error("Set CLOUDFLARE_HYPERDRIVE_ID to your provisioned Hyperdrive ID.");
}
const text = await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8");
const config = JSON.parse(text.replace(/^\s*\/\/.*$/gm, ""));
config.vars.CLOUDFLARE_ENV = "production";
config.hyperdrive = [{ binding: "HYPERDRIVE", id }];
await writeFile(new URL("../wrangler.deploy.json", import.meta.url), JSON.stringify(config, null, 2) + "\n");
console.log("Wrote wrangler.deploy.json with the HYPERDRIVE binding.");

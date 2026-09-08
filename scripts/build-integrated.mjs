import { cp, mkdir, rm, symlink, readFile, writeFile, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { resolve, join, relative } from "node:path";
import { createHash } from "node:crypto";
import { build } from "esbuild";

const root = resolve(import.meta.dirname, "..");
const staging = join(root, ".integrated-build");
const dist = join(root, "dist");
execFileSync(process.execPath, [join(root, "scripts/verify-vendored-sdk.mjs")], { cwd: root, stdio: "inherit" });
await rm(staging, { recursive: true, force: true });
await rm(dist, { recursive: true, force: true });
await mkdir(staging, { recursive: true });
for (const name of ["app", "components", "hooks", "lib", "public", "vendor", "package.json", "tsconfig.json", "postcss.config.mjs", "cloudflare-env.d.ts"])
  await cp(join(root, name), join(staging, name), { recursive: true });
await rm(join(staging, "app/api"), { recursive: true });
await rm(join(staging, "app/opengraph-image.tsx"), { force: true });
await rm(join(staging, "app/apple-icon.tsx"), { force: true });
await symlink(join(root, "node_modules"), join(staging, "node_modules"), "dir");
await writeFile(join(staging, "next.config.mjs"), `export default {output:"export",basePath:"/demo/shop",trailingSlash:true,images:{unoptimized:true},env:{NEXT_PUBLIC_DEMO_API_BASE:"/api/demo-shop",NEXT_PUBLIC_DEMO_BASE_PATH:"/demo/shop"}};\n`);
execFileSync(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "build"], { cwd: staging, stdio: "inherit", env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
await mkdir(join(dist, "cloudflare-assets/demo"), { recursive: true });
await cp(join(staging, "out"), join(dist, "cloudflare-assets/demo/shop"), { recursive: true });
await build({
  entryPoints: [join(root, "cloudflare/handler.ts")], outfile: join(dist, "cloudflare-handler.mjs"),
  bundle: true, format: "esm", platform: "node", target: "es2022", minify: false,
  external: ["pg", "node:*", "cloudflare:*"],
  alias: { "@": root, "server-only": join(root, "cloudflare/empty.ts"), "@opennextjs/cloudflare": join(root, "cloudflare/opennext-shim.ts") },
});
const runtime = await readFile(join(root, "lib/demo-runtime.ts"), "utf8");
const interfaces = runtime.slice(runtime.indexOf("export interface DemoShopEnv"), runtime.indexOf("type Runtime ="));
await writeFile(join(dist, "cloudflare-handler.d.mts"), `${interfaces}\nexport declare function handleDemoShopRequest(request: Request, env: DemoShopEnv, options?: DemoShopOptions): Promise<Response>;\n`);
await cp(join(root, "db/migrations"), join(dist, "migrations"), { recursive: true });
const digests = {};
async function hashDirectory(directory) {
  for (const name of (await readdir(directory)).sort()) {
    const path = join(directory, name);
    const entries = await readdir(path).catch(() => null);
    if (entries) await hashDirectory(path);
    else digests[relative(dist, path)] = createHash("sha256").update(await readFile(path)).digest("hex");
  }
}
await hashDirectory(dist);
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const dirty = Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim());
const sdk = JSON.parse(await readFile(join(root, "vendor/sdk/provenance.json"), "utf8"));
await writeFile(join(dist, "provenance.json"), JSON.stringify({ repository: "plurel-company/split-shop", commit, dirty, sdk, digests }, null, 2) + "\n");
console.log("Integrated demo assets and API handler are ready in dist/. No Worker was deployed.");

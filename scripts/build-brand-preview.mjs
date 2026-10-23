import { cp, mkdir, mkdtemp, readFile, writeFile, readdir, symlink } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import { previewBuildEnv } from "./brand-preview-env.mjs";
import { publishPreview } from "./publish-brand-preview.mjs";

const root = resolve(import.meta.dirname, "..");
const buildParent = join(root, ".brand-preview-build");
await mkdir(buildParent, { recursive: true });
const staging = await mkdtemp(join(buildParent, "export-"));
const output = join(root, "dist/brand-preview");
const env = previewBuildEnv(process.env);
execFileSync(process.execPath, [join(root, "scripts/verify-vendored-sdk.mjs")], { cwd: root, env, stdio: "inherit" });

// Explicit copy list excludes credentials, production configuration and API routes.
for (const name of ["components", "hooks", "lib", "public", "vendor", "package.json", "tsconfig.json", "postcss.config.mjs", "cloudflare-env.d.ts"]) {
  await cp(join(root, name), join(staging, name), { recursive: true });
}
await mkdir(join(staging, "app"));
for (const entry of await readdir(join(root, "app"), { withFileTypes: true })) {
  if (entry.isFile()) await cp(join(root, "app", entry.name), join(staging, "app", entry.name));
}
await symlink(join(root, "node_modules"), join(staging, "node_modules"), process.platform === "win32" ? "junction" : "dir");
await writeFile(join(staging, "next.config.mjs"), 'export default { output: "export", outputFileTracingRoot: process.cwd(), trailingSlash: true, images: { unoptimized: true } };\n');
execFileSync(process.execPath, [join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"], { cwd: staging, env, stdio: "inherit" });

// Assemble the complete artifact before attempting to replace the current bundle.
if (relative(root, output).replaceAll("\\", "/") !== "dist/brand-preview") throw new Error("Unexpected preview output directory");
const packaged = await mkdtemp(join(buildParent, "artifact-"));
await cp(join(staging, "out"), join(packaged, "public"), { recursive: true });
await cp(join(root, "cloudflare/brand-preview-worker.mjs"), join(packaged, "worker.mjs"));
const config = JSON.parse(await readFile(join(root, "wrangler.brand-preview.jsonc"), "utf8"));
await writeFile(join(packaged, "wrangler.jsonc"), JSON.stringify({ ...config, $schema: undefined, main: "worker.mjs", assets: { ...config.assets, directory: "public" } }, null, 2) + "\n");
const digests = {};
async function hash(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await hash(path);
    else digests[relative(packaged, path).replaceAll("\\", "/")] = createHash("sha256").update(await readFile(path)).digest("hex");
  }
}
await hash(packaged);
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
await writeFile(join(packaged, "provenance.json"), JSON.stringify({ purpose: "Static visual preview; checkout disconnected", commit, dirty: Boolean(execFileSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).trim()), digests }, null, 2) + "\n");
await mkdir(join(root, "dist"), { recursive: true });
await publishPreview(packaged, output);
console.log("Isolated preview prepared in dist/brand-preview. Nothing deployed; no resources created.");

import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const artifact = resolve(import.meta.dirname, "../dist/brand-preview");
const assets = join(artifact, "public");
const html = await readFile(join(assets, "index.html"), "utf8");
assert.match(html, /Split the bill/);
assert.match(html, /SplitShop home/);
assert.doesNotMatch(html, /\/brand\/plurel\/plurel-pay-starburst\.svg/);
assert.match(html, /Your cart is empty/);
assert.match(html, /splitshop-brand-preview\.invalid/);
assert.doesNotMatch(html, /https:\/\/splitshop\.dev/);
const localAssets = [...html.matchAll(/(?:src|href)="(\/(?:_next\/|brand\/)[^"]+)"/g)].map(match => match[1]);
assert.ok(localAssets.length > 3);
for (const path of new Set(localAssets)) assert.ok((await stat(join(assets, path.split("?")[0]))).isFile(), path);
let css = "";
for (const name of await readdir(join(assets, "_next/static/css"))) css += await readFile(join(assets, "_next/static/css", name), "utf8");
assert.equal([...css.matchAll(/@font-face/g)].length, 0);
assert.match(css, /--plurel-canvas:\s*#f5f4ef/);
assert.doesNotMatch(css, /Plurel Text/);
assert.doesNotMatch(css, /libre-franklin/);
assert.doesNotMatch(css, /--color-paper:\s*#f7f3ec/);
assert.doesNotMatch(css, /(?:linear|radial)-gradient\(/);
const fontUrls = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(match => match[1].replaceAll(/["']/g, ""));
assert.equal(fontUrls.length, 0);
for (const path of fontUrls) {
  const file = path.startsWith("/") ? join(assets, path) : resolve(assets, "_next/static/css", path);
  assert.ok((await stat(file)).size > 0);
}
const sourceConfig = JSON.parse(await readFile(new URL("../wrangler.brand-preview.jsonc", import.meta.url), "utf8"));
const bundledConfig = JSON.parse(await readFile(join(artifact, "wrangler.jsonc"), "utf8"));
const { $schema, ...expectedConfig } = sourceConfig;
assert.deepEqual(bundledConfig, { ...expectedConfig, main: "worker.mjs", assets: { ...sourceConfig.assets, directory: "public" } });
const provenance = JSON.parse(await readFile(join(artifact, "provenance.json"), "utf8"));
for (const [path, digest] of Object.entries(provenance.digests)) {
  assert.equal(createHash("sha256").update(await readFile(join(artifact, path))).digest("hex"), digest, path);
}
console.log(`Preview verified: independent SplitShop identity, system typography, no Plurel site wordmark, local assets and ${Object.keys(provenance.digests).length} file digests.`);

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const provenance = JSON.parse(await readFile(join(root, "vendor/sdk/provenance.json"), "utf8"));
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const require = createRequire(join(root, "package.json"));
assert.equal(provenance.repository, "https://github.com/plurel-company/plurelpay-sdk");
assert.match(provenance.commit, /^[a-f0-9]{40}$/);

async function installedPackage(packageName, resolver) {
  const entry = resolver.resolve(packageName);
  const installed = JSON.parse(await readFile(join(dirname(entry), "../package.json"), "utf8"));
  assert.equal(installed.name, packageName, `Unexpected package resolved for ${packageName}`);
  return { entry, manifest: installed };
}

for (const packageName of ["@plurel/sdk", "@plurel/react-sdk"]) {
  const artifact = provenance.packages[packageName];
  assert.match(artifact.file, /^plurel-(?:react-)?sdk-\d+\.\d+\.\d+\.tgz$/);
  const file = join(root, "vendor/sdk", artifact.file);
  const digest = createHash("sha256").update(await readFile(file)).digest("hex");
  assert.equal(digest, artifact.sha256, `${packageName} archive differs from its reviewed checksum`);
  const packed = JSON.parse(execFileSync("tar", ["-xOf", file, "package/package.json"], { encoding: "utf8" }));
  assert.equal(packed.name, packageName);
  assert.equal(packed.version, artifact.version);
  assert.equal(manifest.dependencies[packageName], `file:vendor/sdk/${artifact.file}`);
  const installed = await installedPackage(packageName, require);
  assert.equal(installed.manifest.version, artifact.version, `Run pnpm install to use the reviewed ${packageName}`);
  if (packageName === "@plurel/react-sdk") {
    assert.equal(packed.dependencies["@plurel/sdk"], provenance.packages["@plurel/sdk"].version);
    const resolvedCore = await installedPackage("@plurel/sdk", createRequire(installed.entry));
    assert.equal(resolvedCore.entry, require.resolve("@plurel/sdk"), "React must use the same vendored core SDK");
  }
}
assert.equal(manifest.pnpm.overrides["@plurel/react-sdk>@plurel/sdk"], `file:vendor/sdk/${provenance.packages["@plurel/sdk"].file}`);
console.log(`Verified vendored SDK ${provenance.packages["@plurel/sdk"].version} from ${provenance.commit.slice(0, 7)}.`);

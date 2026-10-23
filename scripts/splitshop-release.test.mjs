import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const read = path => readFile(new URL('../'+path, import.meta.url), 'utf8');

test('SplitShop owns the storefront header, footer, metadata and icon', async () => {
  const shell = await read('components/store-shell.tsx');
  assert.match(shell, /aria-label="SplitShop home"/);
  assert.equal((shell.match(/className="splitshop-wordmark"/g)||[]).length, 2);
  assert.doesNotMatch(shell, /PlurelMark|plurel-starburst|plurel-pay-starburst/);
  assert.match(await read('app/layout.tsx'), /siteName: "SplitShop"/);
  assert.doesNotMatch(await read('app/plurel-tokens.css'), /@font-face|url\(/);
});

test('release keeps a supported framework and does not bypass the support guard', async () => {
  const pkg = JSON.parse(await read('package.json'));
  assert.equal(pkg.dependencies.next, '16.3.8');
  for (const file of ['scripts/app-build.mjs','scripts/build-brand-preview.mjs','scripts/build-integrated.mjs']) {
    const source=await read(file);
    assert.match(source, /--webpack/);
    assert.doesNotMatch(source, /dangerouslyUseUnsupportedNextVersion|dangerously-use-unsupported-next-version/);
  }
  const config=await read('wrangler.jsonc');
  assert.match(config, /"name": "splitshop"/);
  assert.match(config, /"id": "11494092435949ef9523a523fbc389ec"/);
});

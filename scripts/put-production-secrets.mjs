#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const keys = [
  "NEXT_PUBLIC_PLUREL_MERCHANT_ID",
  "NEXT_PUBLIC_PLUREL_PUBLISHABLE_KEY_TEST",
  "PLUREL_SECRET_KEY_TEST",
  "PLUREL_SIGNING_SECRET",
  "PLUREL_WEBHOOK_SECRET_TEST",
];

const parsed = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      return match ? [[match[1], match[2] ?? ""]] : [];
    }),
);

let failed = false;
for (const key of keys) {
  const value = parsed[key]?.trim();
  if (!value) {
    console.error(`missing ${key} in .env.local`);
    failed = true;
    continue;
  }
  const result = spawnSync(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "secret",
      "put",
      key,
      "--config",
      "wrangler.jsonc",
    ],
    {
      input: value,
      encoding: "utf8",
      env: {
        ...process.env,
        CI: "true",
        CLOUDFLARE_ACCOUNT_ID: "75a70c45096f40acb6be6a09de4054ea",
      },
    },
  );
  if (result.status !== 0) {
    console.error(`failed to put ${key}`);
    failed = true;
    continue;
  }
  console.log(`put ${key}`);
}

if (failed) process.exit(1);

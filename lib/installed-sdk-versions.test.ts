import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";

import sdkProvenance from "../vendor/sdk/provenance.json";
import {
  INSTALLED_PLUREL_REACT_SDK_VERSION,
  INSTALLED_PLUREL_SDK_VERSION,
  correctStaleSdkVersionHeaders,
} from "./installed-sdk-versions";

const require = createRequire(import.meta.url);
const packageVersion = (name: string) => JSON.parse(readFileSync(resolve(dirname(require.resolve(name)), "../package.json"), "utf8")).version;

describe("correctStaleSdkVersionHeaders", () => {
  it("corrects stale SDK telemetry to the actual installed tarball version", () => {
    const headers = new Headers();
    const request = new Request("https://store.example/api/plurel/v1/sessions", {
      method: "POST",
      headers: {
        "X-Plurel-SDK-Version": "0.1.10",
        "X-Plurel-React-SDK-Version": "0.1.10",
      },
    });

    correctStaleSdkVersionHeaders(headers, request);

    assert.equal(headers.get("X-Plurel-SDK-Version"), INSTALLED_PLUREL_SDK_VERSION);
    assert.equal(
      headers.get("X-Plurel-React-SDK-Version"),
      INSTALLED_PLUREL_REACT_SDK_VERSION,
    );
    assert.equal(INSTALLED_PLUREL_SDK_VERSION, packageVersion("@plurel/sdk"));
    assert.equal(INSTALLED_PLUREL_REACT_SDK_VERSION, packageVersion("@plurel/react-sdk"));
    assert.equal(INSTALLED_PLUREL_SDK_VERSION, "1.1.1");
  });

  it("does not overwrite when telemetry already matches package.json", () => {
    const headers = new Headers({
      "X-Plurel-SDK-Version": INSTALLED_PLUREL_SDK_VERSION,
    });
    const request = new Request("https://store.example/api/plurel/v1/sessions", {
      method: "POST",
      headers: {
        "X-Plurel-SDK-Version": INSTALLED_PLUREL_SDK_VERSION,
      },
    });

    correctStaleSdkVersionHeaders(headers, request);

    assert.equal(headers.get("X-Plurel-SDK-Version"), INSTALLED_PLUREL_SDK_VERSION);
  });

  it("uses the reviewed core archive for the React SDK's nested dependency too", () => {
    const reactRequire = createRequire(require.resolve("@plurel/react-sdk"));
    assert.equal(reactRequire.resolve("@plurel/sdk"), require.resolve("@plurel/sdk"));
    assert.equal(packageVersion("@plurel/sdk"), sdkProvenance.packages["@plurel/sdk"].version);
    assert.equal(packageVersion("@plurel/react-sdk"), sdkProvenance.packages["@plurel/react-sdk"].version);
  });
});

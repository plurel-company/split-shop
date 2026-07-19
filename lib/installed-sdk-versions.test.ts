import assert from "node:assert/strict";
import { describe, it } from "node:test";

import packageJson from "../package.json";
import {
  INSTALLED_PLUREL_REACT_SDK_VERSION,
  INSTALLED_PLUREL_SDK_VERSION,
  correctStaleSdkVersionHeaders,
} from "./installed-sdk-versions";

/** Mirrors installedPackageVersion()'s range-prefix stripping in installed-sdk-versions.ts. */
const expectedInstalledSdkVersion = packageJson.dependencies["@plurel/sdk"].replace(
  /^[\^~>=<]*/,
  "",
);

describe("correctStaleSdkVersionHeaders", () => {
  it("corrects stale SDK telemetry to match installed package.json", () => {
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
    assert.equal(INSTALLED_PLUREL_SDK_VERSION, expectedInstalledSdkVersion);
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
});

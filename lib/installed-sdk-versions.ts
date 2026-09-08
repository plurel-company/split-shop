import packageJson from "../package.json";
import sdkProvenance from "../vendor/sdk/provenance.json";

function installedPackageVersion(
  packageName: "@plurel/sdk" | "@plurel/react-sdk",
): string {
  const spec = packageJson.dependencies[packageName];
  if (!spec) return "0.0.0";
  if (spec.startsWith("file:")) {
    const artifact = sdkProvenance.packages[packageName];
    if (spec !== `file:vendor/sdk/${artifact.file}`) {
      throw new Error(`Unverified local SDK dependency: ${packageName}`);
    }
    return artifact.version;
  }
  return spec.replace(/^[\^~>=<]*/, "");
}

/** Package versions verified against vendored archives and installed modules at build time. */
export const INSTALLED_PLUREL_SDK_VERSION = installedPackageVersion("@plurel/sdk");
export const INSTALLED_PLUREL_REACT_SDK_VERSION = installedPackageVersion("@plurel/react-sdk");

/** @deprecated Use INSTALLED_PLUREL_SDK_VERSION */
export const INSTALLED_ANTE_SDK_VERSION = INSTALLED_PLUREL_SDK_VERSION;
/** @deprecated Use INSTALLED_PLUREL_REACT_SDK_VERSION */
export const INSTALLED_ANTE_REACT_SDK_VERSION = INSTALLED_PLUREL_REACT_SDK_VERSION;

/**
 * Correct upstream telemetry when the browser sends a version older than this app's
 * verified SDK dependency.
 */
export function correctStaleSdkVersionHeaders(
  headers: Headers,
  request: Request,
): void {
  const clientSdk =
    request.headers.get("x-plurel-sdk-version") ?? request.headers.get("x-ante-sdk-version");
  if (clientSdk && clientSdk !== INSTALLED_PLUREL_SDK_VERSION) {
    headers.set("X-Plurel-SDK-Version", INSTALLED_PLUREL_SDK_VERSION);
    headers.set("X-Ante-SDK-Version", INSTALLED_PLUREL_SDK_VERSION);
  }

  const clientReact =
    request.headers.get("x-plurel-react-sdk-version") ??
    request.headers.get("x-ante-react-sdk-version");
  if (clientReact && clientReact !== INSTALLED_PLUREL_REACT_SDK_VERSION) {
    headers.set("X-Plurel-React-SDK-Version", INSTALLED_PLUREL_REACT_SDK_VERSION);
    headers.set("X-Ante-React-SDK-Version", INSTALLED_PLUREL_REACT_SDK_VERSION);
  }
}

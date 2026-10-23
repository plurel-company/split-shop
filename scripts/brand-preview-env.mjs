/** Only OS/tool lookup settings cross into the static preview build. No .env files are copied. */
export function previewBuildEnv(source) {
  const allowed = new Set(["path", "systemroot", "windir", "comspec", "pathext", "temp", "tmp", "tmpdir", "home", "userprofile", "localappdata", "appdata"]);
  const env = Object.fromEntries(Object.entries(source).filter(([key]) => allowed.has(key.toLowerCase())));
  return {
    ...env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SITE_URL: "https://splitshop-brand-preview.invalid",
    NEXT_PUBLIC_PAY_BASE_URL: "https://checkout-disabled.invalid",
  };
}

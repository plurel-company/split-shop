import * as Sentry from "@sentry/nextjs";

type ClientErrorContext = {
  stage: string;
  ua?: string;
  href?: string;
  online?: boolean | null;
};

/** Checkout and storefront client errors — Sentry when configured, same-origin log as fallback. */
export function reportClientError(stage: string, error: Error, extra?: Partial<ClientErrorContext>) {
  const context: ClientErrorContext = {
    stage,
    ua: extra?.ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : undefined),
    href: extra?.href ?? (typeof location !== "undefined" ? location.href : undefined),
    online: extra?.online ?? (typeof navigator !== "undefined" ? navigator.onLine : null),
  };

  Sentry.withScope((scope) => {
    scope.setTag("checkout_stage", stage);
    scope.setContext("client", context);
    Sentry.captureException(error);
  });

  try {
    void fetch("/api/client-log", {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...context,
        name: error.name,
        message: String(error.message).slice(0, 500),
        ts: new Date().toISOString(),
      }),
    });
  } catch {
    /* ignore */
  }
}

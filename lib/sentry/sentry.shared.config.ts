import type { BrowserOptions, ErrorEvent } from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;

export function isSentryEnabled(): boolean {
  return Boolean(dsn?.trim());
}

export function sentryRelease(): string | undefined {
  return (
    process.env.SENTRY_RELEASE?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim() ||
    undefined
  );
}

export function sharedSentryOptions(): Partial<BrowserOptions> {
  const environment =
    process.env.SENTRY_ENVIRONMENT?.trim() ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    "development";

  return {
    dsn,
    enabled: isSentryEnabled(),
    environment,
    release: sentryRelease(),
    tracesSampleRate: environment === "production" ? 0.1 : 1,
    sendDefaultPii: false,
    beforeSend(event: ErrorEvent) {
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }
      return event;
    },
  };
}

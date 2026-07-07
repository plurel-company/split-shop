/** POST /api/client-log — checkout telemetry fallback (also captured in Sentry when configured). */
import * as Sentry from "@sentry/nextjs";

import { isSentryEnabled } from "@/lib/sentry/sentry.shared.config";

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = { message: "unparseable payload" };
  }

  const stage = typeof body.stage === "string" ? body.stage : "unknown";
  const message = typeof body.message === "string" ? body.message : "client error";

  if (isSentryEnabled()) {
    Sentry.withScope((scope) => {
      scope.setTag("checkout_stage", stage);
      scope.setContext("client", body);
      Sentry.captureMessage(`[client-log] ${stage}: ${message}`, "error");
    });
  } else if (process.env.NODE_ENV !== "production") {
    console.error("[client-error]", JSON.stringify(body).slice(0, 2000));
  }

  return new Response(null, { status: 204 });
}

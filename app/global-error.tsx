"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            margin: "4rem auto",
            maxWidth: "32rem",
            padding: "0 1rem",
            fontFamily: "system-ui",
          }}
        >
          <h1>Something went wrong</h1>
          <p>We have been notified. You can try again or return to the storefront.</p>
          <p style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={() => reset()}>
              Try again
            </button>
            <a href="/">Home</a>
          </p>
        </main>
      </body>
    </html>
  );
}

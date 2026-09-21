import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const isWorkersCi = process.env.WORKERS_CI === "1" || process.env.WORKERS_CI === "true";
if (process.env.NODE_ENV !== "production" && !isWorkersCi) {
  initOpenNextCloudflareForDev();
}

import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

const sentryOrg = process.env.SENTRY_ORG?.trim();
const sentryProject = process.env.SENTRY_PROJECT?.trim();

export default withSentryConfig(nextConfig, {
  org: sentryOrg,
  project: sentryProject,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});

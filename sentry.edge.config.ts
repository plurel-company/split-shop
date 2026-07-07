import * as Sentry from "@sentry/nextjs";

import { sharedSentryOptions } from "./lib/sentry/sentry.shared.config";

Sentry.init({
  ...sharedSentryOptions(),
});

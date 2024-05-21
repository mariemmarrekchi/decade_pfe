// This file configures the initialization of Sentry on the browser.
// The config you add here will be used whenever a page is visited.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';
import getConfig from "next/config";
import {filterDuplicateErrors} from "./utils/sentryReportError";
const {publicRuntimeConfig} = getConfig();
if (publicRuntimeConfig.deployEnv === "production" || publicRuntimeConfig.deployEnv === 'pfh') {
  Sentry.init({
    ignoreErrors: [
      /.*Non-Error promise rejection captured.*/,
      /.*t is not a function.*/,
      /.*Load failed.*/,
      /.*T2S is not defined.*/,
    ],
    denyUrls: [/.*\.abtasty\.com/],
    dsn: publicRuntimeConfig.sentryDsn,
    environment: publicRuntimeConfig.deployEnv,
    // Adjust this value in production, or use tracesSampler for greater control
    //tracesSampleRate: publicRuntimeConfig.tracesSimpleRate,
    sampleRate: publicRuntimeConfig.simpleRate,
    release: "but-nextjs@" + process.env.NEXT_BUILD_ID ,
        beforeSend: (event, hint) => {
      return filterDuplicateErrors(event); // Return the event to allow Sentry to capture the error
    },
    // ...
    // Note: if you want to override the automatic release value, do not set a
    // `release` value here - use the environment variable `SENTRY_RELEASE`, so
    // that it will also get attached to your source maps
  });
}

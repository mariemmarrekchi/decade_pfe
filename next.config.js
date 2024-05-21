const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");
const { withSentryConfig } = require("@sentry/nextjs");
const path = require("path");

const moduleExports = (phase, { defaultConfig }) => {
  let rewriteNextLocal = []
  if(!!process.env.ASSET_PREFIX){
    rewriteNextLocal.push({ source: `/${process.env.ASSET_PREFIX}/_next/:path*`, destination: '/_next/:path*' })
  }
  let rewriteBeforeFile = [
    // These rewrites are checked after headers/redirects
    // and before all files including _next/public files which
    // allows overriding page files
    ...rewriteNextLocal,
    {
      source: "/:path(.+)/index-c:id(\\d+).html",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "true",
        },
      ],
      destination: "/productsList/mobile/:id",
    },
    {
      source: "/Customer/Account/Dashboard/Id/:id*",
      destination: "/customerAccount/dashboard"
    },
    {
      source: "/Customer/Account/Profile/Id/:id*",
      destination: "/customerAccount/profil"
    },
    {
      source: "/Customer/Account/NewsLetter/Id/:id*",
      destination: "/customerAccount/newsLetter"
    },
    {
      source: "/Customer/Account/ChangePassword/Id/:id*",
      destination: "/customerAccount/newPassword"
    },
    {
      source: "/Customer/Account/Orders/Id/:id*",
      destination: "/customerAccount/orders"
    },
    {
      source: "/Customer/Account/OrderItems/Id/:Id/OrderId/:OrderId",
      destination: "/customerAccount/orderDetails"
    },
    {
      source: "/Customer/Account/SocialMedia/Id/:id*",
      destination: "/customerAccount/socialMedia"
    },
    {
      source: "/:path(.+)/index-c:id(\\d+).html",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "false",
        },
      ],
      destination: "/productsList/default/:id",
    },
    {
      source: "/",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "true",
        },
      ],
      destination: "/home/mobile/",
    },
    {
      source: "/",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "false",
        },
      ],
      destination: "/home/default/",
    },
    {
      //to do here AMO changer avec /produits/(B[0-9]+|[0-9]+)/.+\.html,/:path(.+)/index-c:id(\\d+).html
      source: "/:path(.+)/index-c:id(\\d+)/:filters(.+)",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "true",
        },
      ],
      destination: "/productsList/mobile/:id?filters=:filters",
    },

    {
      //to do here AMO changer avec /produits/(B[0-9]+|[0-9]+)/.+\.html,/:path(.+)/index-c:id(\\d+).html
      source: "/:path(.+)/index-c:id(\\d+)/:filters(.+)",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "false",
        },
      ],
      destination: "/productsList/default/:id?filters=:filters",
    },
    {
      //to do here AMO changer avec /produits/(B[0-9]+|[0-9]+)/.+\.html,/:path(.+)/index-c:id(\\d+).html
      source: "/produits/:id(B[0-9]+|[0-9]+)/:title(.+).html",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "true",
        },
      ],
      destination: "/product/mobile",
    },
    {
      source: "/Common/Search/SearchProductsList:queryParams*",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "true",
        },
      ],
      destination: "/search/mobile/:queryParams*",
    },
    {
      source: "/Common/Search/SearchProductsList:queryParams*",
      has: [
        {
          type: "header",
          key: "cloudfront-is-mobile-viewer",
          value: "false",
        },
      ],
      destination: "/search/default/:queryParams*",
    },
    {
      source: "/Purchase/Cart/Summary",

      destination: "/purchase/cart"
    },
    {
      source: "/Purchase/Order/ConfirmationPage",

      destination: "/purchase/confirmation"
    },


    {
      source: "/Purchase/Identification/Index",

      destination: "/purchase/identification"
    },

    {
      source: "/Purchase/Cart/Shipping",

      destination: "/purchase/shipping"
    },

  ]

  return {
    target: "experimental-serverless-trace",
    serverRuntimeConfig: {
      referer: process.env.REFERER,
      backBaseUrl: process.env.BACK_BASE_API_URL,
      origin: process.env.ORIGIN,
      butKey:process.env.BUT_KEY
    },
    assetPrefix: !!process.env.ASSET_PREFIX ? process.env.ASSET_PREFIX : undefined,
    productionBrowserSourceMaps: true,
    publicRuntimeConfig: {
      frontBaseUrl: process.env.FRONT_BASE_API_URL,
      sentryDsn: process.env.SENTRY_DSN,
      tracesSimpleRate: process.env.TRACES_SAMPLE_RATE,
      simpleRate: process.env.SAMPLE_RATE,
      deployEnv: process.env.DEPLOY_ENV,
      nodeEnv: process.env.NODE_ENV,
    },
    sassOptions: {
      includePaths: [path.join(__dirname, "styles")],
    },
    webpack5: false,
    eslint: {
      ignoreDuringBuilds: true,
    },
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.plugins.push(new webpack.EnvironmentPlugin({ NEXT_BUILD_ID: buildId ,SENTRY_RELEASE :"but-nextjs@"+buildId}));
      return config;
    },
    async redirects() {
      return [
        {
          source: "/:path(.+)/index-c:id(\\d+)",
          destination: "/:path(.+)/index-c:id(\\d+).html",
          permanent: true,
        },
      ];
    },
    async rewrites() {
      return {
        beforeFiles: rewriteBeforeFile,
        afterFiles: [],
        fallback: [
          // These rewrites are checked after both pages/public files
          // and dynamic routes are checked
          {
            source: "/:path*",
            destination: process.env.OLD_ORIGIN + "/:path*",
          },
        ],
      };
    },
  };
};
// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry Webpack plugin. Keep in mind that
  // the following options are set automatically, and overriding them is not
  // recommended:
  //   release, url, org, project, authToken, configFile, stripPrefix,
  //   urlPrefix, include, ignore

  silent: true, // Suppresses all logs
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options.
};

// Make sure adding Sentry options is the last code to run before exporting, to
// ensure that your source maps include changes from all other Webpack plugins
module.exports = (process.env.DEPLOY_ENV === "production" || process.env.DEPLOY_ENV === "pfh" ) ? withSentryConfig(moduleExports, sentryWebpackPluginOptions) : moduleExports ;

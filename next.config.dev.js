const devConfig = {
    target: "experimental-serverless-trace",
    serverRuntimeConfig: {
        referer: process.env.REFERER,
        backBaseUrl: process.env.BACK_BASE_API_URL,
        origin: process.env.ORIGIN,
    },
    publicRuntimeConfig: {
        frontBaseUrl: process.env.FRONT_BASE_API_URL,
        sentryDsn: process.env.SENTRY_DSN ,
        tracesSimpleRate: process.env.TRACES_SAMPLE_RATE,
        simpleRate: process.env.SAMPLE_RATE,
        deployEnv: process.env.DEPLOY_ENV,
        nodeEnv: process.env.NODE_ENV,
    },
    webpack5: false,
    eslint: {
        ignoreDuringBuilds: true,
    },
    async redirects() {
        return [
            {
                source: '/:path(.+)/index-c:id(\\d+)',
                destination: '/:path(.+)/index-c:id(\\d+).html',
                permanent: true,
            },
        ]
    },
    async rewrites() {
        return {
            beforeFiles: [
                // These rewrites are checked after headers/redirects
                // and before all files including _next/public files which
                // allows overriding page files
                {
                    source: "/:path(.+)/index-c:id(\\d+).html",
                    destination: "/productsList/:id"
                },
                { // /.+/index-(c[0-9]+)+(.+)
                    source: "/:path(.+)/index-c:id(\\d+)/:filters(.+)",
                    destination: "/productsList/:id?filters=:filters"
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
                    source: "/Customer/Account/ChangePassword/Id/:id*",
                    destination: "/customerAccount/newPassword"
                },
                {
                    source: "/Customer/Account/Orders/Id/:id*",
                    destination: "/customerAccount/orders"
                },
                {
                    source: "/Customer/Account/NewsLetter/Id/:id*",
                    destination: "/customerAccount/newsLetter"
                },
                {
                    source: "/Customer/Account/OrderItems/Id/:Id/OrderId/:OrderId",
                    destination: "/customerAccount/orderDetails"
                },
                {
                    source: "/Customer/Account/SocialMedia/Id/:id*",
                    destination: "/customerAccount/socialMedia"
                },
                { //to do here AMO changer avec /produits/(B[0-9]+|[0-9]+)/.+\.html,/:path(.+)/index-c:id(\\d+).html
                    source: "/produits/:id(B[0-9]+|[0-9]+)/:title(.+).html",
                    has: [
                        {
                            type: 'header',
                            key: 'user-agent',
                            value: '((.*)(Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile)(.*))'
                        }],
                    destination: "/product/mobile/"
                },
                {
                    source: "/Common/Search/SearchProductsList:queryParams*",
                    destination: "/search:queryParams*"
                }
            ],
            afterFiles: [],
            fallback: [
                // These rewrites are checked after both pages/public files
                // and dynamic routes are checked
                {
                    source: "/:path*",
                    destination: process.env.OLD_ORIGIN + "/:path*"
                },
            ],
        }
    }
}

module.exports = devConfig


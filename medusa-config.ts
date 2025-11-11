import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// SECURITY: Validate required secrets on startup
if (!process.env.JWT_SECRET || !process.env.COOKIE_SECRET) {
  throw new Error(
    'SECURITY ERROR: JWT_SECRET and COOKIE_SECRET environment variables are required. ' +
    'Generate strong secrets using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
  )
}

// SECURITY: Reject weak secrets
const minSecretLength = 32
if (process.env.JWT_SECRET.length < minSecretLength || process.env.COOKIE_SECRET.length < minSecretLength) {
  throw new Error(
    `SECURITY ERROR: JWT_SECRET and COOKIE_SECRET must be at least ${minSecretLength} characters long. ` +
    'Use cryptographically strong random values.'
  )
}

module.exports = defineConfig({
  admin: {
    // Admin panel disabled - deployed separately on Vercel
    // The admin UI is served from a separate Vercel deployment
    // Backend only provides API endpoints for admin operations
    disable: true,
    // Backend URL that admin will connect to (Railway)
    backendUrl: process.env.BACKEND_URL || process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : "http://localhost:9000",
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      // Store CORS - allows storefront domains
      storeCors: process.env.STORE_CORS!,
      // Admin CORS - allows Vercel admin deployment domain
      // CRITICAL: Must include the Vercel admin domain for admin API access
      // Example: https://admin-4wd-tours.vercel.app
      adminCors: process.env.ADMIN_CORS!,
      // Auth CORS - allows authentication from admin domain
      authCors: process.env.AUTH_CORS!,
      // SECURITY: No fallback secrets - must be set in environment
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    // Temporarily disabled for deployment - has TypeScript errors
    // {
    //   resolve: "./src/modules/blog",
    // },
    // {
    //   resolve: "./src/modules/resource_booking",
    // },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
              capture: false, // Manual capture for better control
              automatic_payment_methods: true, // Enable Apple Pay, Google Pay, etc.
            },
          },
        ],
      },
    },
  ],
})

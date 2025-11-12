import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// SECURITY: Build-time safe defaults (will be overridden at runtime by Medusa Cloud)
// Medusa Cloud injects environment variables at RUNTIME, not BUILD-TIME
// These dummy values allow the build to succeed, then real secrets are validated at startup
const JWT_SECRET = process.env.JWT_SECRET || 'BUILD_TIME_DUMMY_VALUE_MIN_32_CHARS_LONG_PLACEHOLDER_JWT_SECRET'
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'BUILD_TIME_DUMMY_VALUE_MIN_32_CHARS_LONG_PLACEHOLDER_COOKIE'

// SECURITY: Runtime-only validation (only when starting server, not during build)
// Check if we're actually starting the server (not just building)
const isServerStartup = process.env.NODE_ENV === 'production' || process.argv.some(arg => arg.includes('start') || arg.includes('develop'))

if (isServerStartup) {
  // SECURITY: Validate required secrets on server startup
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

  // SECURITY: Check if using dummy build-time values in production
  if (JWT_SECRET.includes('DUMMY') || COOKIE_SECRET.includes('DUMMY')) {
    throw new Error(
      'SECURITY ERROR: Production environment detected with dummy secrets. ' +
      'Set real JWT_SECRET and COOKIE_SECRET environment variables in Medusa Cloud dashboard.'
    )
  }
}

module.exports = defineConfig({
  admin: {
    // Environment-based admin configuration
    // Local: Admin served from backend (disable: false)
    // Production: Admin served from Vercel (disable: true)
    disable: process.env.DISABLE_ADMIN === 'true',
    // Backend URL for admin API calls
    backendUrl: process.env.BACKEND_URL || "http://localhost:9000",
    // Use default /app path (Medusa v2 standard)
    path: "/app",
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
      // SECURITY: Use build-safe values with runtime validation
      jwtSecret: JWT_SECRET,
      cookieSecret: COOKIE_SECRET,
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

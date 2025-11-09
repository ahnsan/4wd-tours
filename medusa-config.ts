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
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      // SECURITY: No fallback secrets - must be set in environment
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "./src/modules/blog",
    },
    {
      resolve: "./src/modules/resource_booking",
    },
  ],
})

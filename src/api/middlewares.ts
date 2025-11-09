import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"

// Middleware to log blog API requests
async function logBlogRequest(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  console.log(`[Blog API] ${req.method} ${req.path}`)
  next()
}

// Middleware to log resource booking API requests
async function logResourceBookingRequest(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  console.log(`[Resource Booking API] ${req.method} ${req.path}`)
  next()
}

// Middleware to validate admin authentication
// Properly validates user authentication and admin role
async function authenticateAdmin(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Verify user is authenticated
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required. Please log in to access admin resources."
      })
    }

    // Verify user has admin role
    // Medusa's admin users have role property set to "admin"
    if (!req.user.role || req.user.role !== "admin") {
      return res.status(403).json({
        message: "Admin access required. Insufficient permissions."
      })
    }

    // User is authenticated and has admin role
    next()
  } catch (error) {
    console.error('[Auth Error]', error)
    return res.status(401).json({
      message: "Invalid authentication credentials"
    })
  }
}

// Middleware to add CORS headers for blog endpoints
// Uses environment-based whitelist instead of wildcard
async function blogCors(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Get allowed origins from environment variable
  const allowedOrigins = (process.env.STORE_CORS || "http://localhost:8000")
    .split(",")
    .map(origin => origin.trim())

  const origin = req.headers.origin

  // Only set CORS headers if origin is in whitelist
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Access-Control-Allow-Credentials", "true")
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }

  next()
}

// Middleware to add CORS headers for store resource booking endpoints
async function storeCors(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // Get allowed origins from environment variable
  const allowedOrigins = (process.env.STORE_CORS || "http://localhost:8000")
    .split(",")
    .map(origin => origin.trim())

  const origin = req.headers.origin

  // Only set CORS headers if origin is in whitelist
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Access-Control-Allow-Credentials", "true")
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (req.method === "OPTIONS") {
    return res.sendStatus(200)
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/blog/*",
      middlewares: [logBlogRequest, authenticateAdmin],
    },
    {
      matcher: "/store/blog/*",
      middlewares: [logBlogRequest, blogCors],
    },
    {
      matcher: "/admin/resource-booking/*",
      middlewares: [logResourceBookingRequest, authenticateAdmin],
    },
    {
      matcher: "/store/resource-booking/*",
      middlewares: [logResourceBookingRequest, storeCors],
    },
  ],
})

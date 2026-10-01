import { defineMiddlewares, authenticate } from "@medusajs/medusa"
import { rateLimit } from "express-rate-limit"
import fs from "fs"
import path from "path"

// ---------------------------------------------------------------------------
// Rate limiters for auth/OTP endpoints
// ---------------------------------------------------------------------------

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please wait 15 minutes before trying again." },
  keyGenerator: (req) => req.ip ?? "unknown",
})

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many verification attempts. Please wait 15 minutes." },
  keyGenerator: (req) => req.ip ?? "unknown",
})

export default defineMiddlewares({
  routes: [
    // Preserve raw body for Razorpay webhook signature verification
    {
      matcher: "/store/payments/razorpay/webhook",
      method: "POST",
      bodyParser: { preserveRawBody: true },
    },

    // Admin upload size cap
    {
      matcher: "/admin/uploads",
      method: "POST",
      bodyParser: { sizeLimit: 2 * 1024 * 1024 },
    },

    // ---------------------------------------------------------------------------
    // Rate limiting on auth / OTP endpoints
    // ---------------------------------------------------------------------------
    {
      matcher: "/store/auth/forgot-password",
      method: "POST",
      middlewares: [otpSendLimiter],
    },
    {
      matcher: "/auth/customer/verify/request",
      method: "POST",
      middlewares: [otpSendLimiter],
    },
    {
      matcher: "/auth/customer/verify/confirm",
      method: "POST",
      middlewares: [otpVerifyLimiter],
    },
    {
      matcher: "/store/auth/otp/verify",
      method: "POST",
      middlewares: [otpVerifyLimiter],
    },
    {
      matcher: "/store/auth/phone-login",
      method: "POST",
      middlewares: [otpSendLimiter],
    },

    // ---------------------------------------------------------------------------
    // Protect custom admin routes with Medusa admin authentication
    // (Medusa does not automatically guard custom /admin/* routes)
    // ---------------------------------------------------------------------------
    {
      matcher: "/admin/customer-order-requests*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/admin/store/sales*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/admin/payments/razorpay*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },
    {
      matcher: "/admin/store/sale*",
      middlewares: [authenticate("user", ["session", "bearer"])],
    },

    // ---------------------------------------------------------------------------
    // Serve uploaded files (with path traversal prevention)
    // ---------------------------------------------------------------------------
    {
      matcher: "/uploads/*",
      middlewares: [
        (req, res, next) => {
          const urlPath = req.originalUrl.split("?")[0]
          const filename = urlPath.replace(/^\/uploads\//, "").replace(/^\/+/, "")
          const filePath = path.resolve("/app/uploads", filename)

          // Prevent path traversal — resolved path must stay inside /app/uploads
          if (!filePath.startsWith("/app/uploads/")) {
            res.status(400).end()
            return
          }

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.sendFile(filePath)
          } else {
            next()
          }
        },
      ],
    },
  ],
})

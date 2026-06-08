import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { appContainer } from "./app.js";

import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { cartRouter } from "./routes/cart.js";
import { checkoutRouter, ordersRouter, paymentsRouter } from "./routes/checkout.js";
import { adminRouter } from "./routes/admin.js";

const app = express();
const { env } = appContainer;

// ─── Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

app.use("/api", apiLimiter);

// ─── HEALTH ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    storageMode: env.STORAGE_MODE,
    timestamp: new Date().toISOString()
  });
});

// ─── ROUTES ────────────────────────────────────────────────
app.use("/api/auth", authRouter(appContainer));
app.use("/api/products", productsRouter(appContainer));
app.use("/api/carts", cartRouter(appContainer));
app.use("/api/checkout", checkoutRouter(appContainer));
app.use("/api/orders", ordersRouter(appContainer));
app.use("/api/payments", paymentsRouter(appContainer));
app.use("/api/admin", adminRouter(appContainer));

// ─── GLOBAL ERROR HANDLER ──────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("[backend] Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// ─── SERVER ────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`[backend] API Server running on http://localhost:${env.PORT}`);
  console.log(`[backend] Storage mode: ${env.STORAGE_MODE}`);
  console.log(`[backend] Payment provider: ${env.PAYMENT_PROVIDER}`);
  console.log(`[backend] CORS origin: ${env.CORS_ORIGIN}`);
});

import express from "express";
import cors from "cors";
import { appContainer } from "./app.js";

const app = express();
const { env } = appContainer;

// ─── Middleware ─────────────────────────────────────────────
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

// ─── HEALTH ────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    storageMode: env.STORAGE_MODE,
    timestamp: new Date().toISOString()
  });
});

// ─── AUTHENTICATION ────────────────────────────────────────

app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, passwordHash, firstName, lastName } = req.body;
    const user = await appContainer.services.authService.register({ email, passwordHash, firstName, lastName });
    res.json(user);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, passwordHash } = req.body;
    const result = await appContainer.services.authService.login(email, passwordHash);
    res.json(result);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Missing authorization header");
    }
    const token = authHeader.split(" ")[1];
    const user = await appContainer.services.authService.getMe(token);
    res.json(user);
  } catch (error: any) {
    const statusCode = error.statusCode || 401;
    res.status(statusCode).json({ error: error.message });
  }
});

// ─── ADMIN ─────────────────────────────────────────────────

app.get("/api/admin/orders", async (_req, res) => {
  try {
    const orders = await appContainer.services.orderService.listAllOrders();
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.get("/api/admin/stats", async (_req, res) => {
  try {
    const orders = await appContainer.services.orderService.listAllOrders();
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalInCents, 0);
    res.json({
      totalOrders: orders.length,
      totalRevenueInCents: totalRevenue,
      averageOrderValueInCents: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ─── PRODUCTS ──────────────────────────────────────────────

app.get("/api/products", async (_req, res) => {
  try {
    const products = await appContainer.services.productService.listPublishedProducts();
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/api/products/:handle", async (req, res) => {
  try {
    const handle = req.params.handle;
    const product = await appContainer.services.productService.getProductByHandle(handle);
    res.json(product);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// ─── CARTS ─────────────────────────────────────────────────

// Create a new empty cart
app.post("/api/carts", async (_req, res) => {
  try {
    const cartId = `cart_${Date.now()}`;
    const cart = await appContainer.services.cartService.createCart(cartId, "inr");
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create cart" });
  }
});

// Get a cart by ID
app.get("/api/carts/:id", async (req, res) => {
  try {
    const cart = await appContainer.services.cartService.getCart(req.params.id);
    res.json(cart);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// Add an item to the cart
app.post("/api/carts/:id/items", async (req, res) => {
  try {
    const cartId = req.params.id;
    const { productId, variantId, quantity } = req.body;

    const productData = await appContainer.repositories.products.findById(productId);
    if (!productData) throw new Error("Product not found");
    const variant = productData.variants.find((v) => v.id === variantId);
    if (!variant) throw new Error("Variant not found");

    const cart = await appContainer.services.cartService.addItem(cartId, {
      productId,
      variantId,
      quantity,
      unitPriceInCents: variant.priceInCents
    });

    res.json(cart);
  } catch (error: any) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message || "Failed to add item" });
  }
});

// Update item quantity
app.patch("/api/carts/:id/items/:itemId", async (req, res) => {
  try {
    const { quantity } = req.body;
    const cart = await appContainer.services.cartService.updateItemQuantity(
      req.params.id,
      req.params.itemId,
      quantity
    );
    res.json(cart);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// Remove item from cart
app.delete("/api/carts/:id/items/:itemId", async (req, res) => {
  try {
    const cart = await appContainer.services.cartService.removeItem(
      req.params.id,
      req.params.itemId
    );
    res.json(cart);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// Apply promo code
app.post("/api/carts/:id/promo", async (req, res) => {
  try {
    const { code } = req.body;
    const cart = await appContainer.services.cartService.applyPromoCode(req.params.id, code);
    res.json(cart);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// ─── CHECKOUT ──────────────────────────────────────────────

app.post("/api/checkout/:cartId", async (req, res) => {
  try {
    const order = await appContainer.services.orderService.createFromCart(req.params.cartId);
    res.json(order);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// ─── ORDERS ────────────────────────────────────────────────

app.get("/api/orders/:id", async (req, res) => {
  try {
    const order = await appContainer.services.orderService.getOrderById(req.params.id);
    res.json(order);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// ─── PAYMENTS ──────────────────────────────────────────────

app.post("/api/payments/:orderId/authorize", async (req, res) => {
  try {
    const { amountInCents } = req.body;
    const payment = await appContainer.services.paymentService.initializePayment(
      req.params.orderId,
      amountInCents
    );

    // After successful payment, mark order as confirmed
    try {
      const order = await appContainer.services.orderService.getOrderById(req.params.orderId);
      order.status = "confirmed";
      await appContainer.repositories.orders.save(order);
    } catch {
      // Order update is best-effort; payment result is authoritative
    }

    res.json(payment);
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ error: error.message });
  }
});

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

import { Router } from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import type { AppContainer } from "../app.js";

export const checkoutRouter = (appContainer: AppContainer) => {
  const router = Router();

  router.post("/:cartId", async (req, res) => {
    try {
      const order = await appContainer.services.orderService.createFromCart(req.params.cartId);
      res.json(order);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  return router;
};

export const ordersRouter = (appContainer: AppContainer) => {
  const router = Router();

  router.get("/me", requireAuth, async (req, res) => {
    try {
      const orders = await appContainer.services.orderService.listOrdersByCustomer(req.user!.id);
      res.json(orders);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const order = await appContainer.services.orderService.getOrderById(req.params.id);
      res.json(order);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  return router;
};

export const paymentsRouter = (appContainer: AppContainer) => {
  const router = Router();

  router.post("/:orderId/authorize", async (req, res) => {
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
        
        // Also clear the cart
        await appContainer.services.cartService.clearCart(order.cartId);
      } catch (err) {
        console.error("Failed to update order status or clear cart:", err);
      }

      res.json(payment);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  return router;
};

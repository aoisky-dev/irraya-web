import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import type { AppContainer } from "../app.js";

export const adminRouter = (appContainer: AppContainer) => {
  const router = Router();

  // Protect all admin routes
  router.use(requireAuth, requireRole("admin"));

  router.get("/orders", async (_req, res) => {
    try {
      const orders = await appContainer.services.orderService.listAllOrders();
      res.json(orders);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  router.get("/stats", async (_req, res) => {
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

  return router;
};

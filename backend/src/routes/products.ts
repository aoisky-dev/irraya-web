import { Router } from "express";
import { ProductFilterSchema } from "../validation/products.js";
import type { AppContainer } from "../app.js";

export const productsRouter = (appContainer: AppContainer) => {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const filter = ProductFilterSchema.parse(req.query);
      const cleanFilter = Object.fromEntries(Object.entries(filter).filter(([_, v]) => v !== undefined));
      const products = await appContainer.services.productService.listPublishedProducts(cleanFilter);
      res.json(products);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
        return;
      }
      console.error(error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  router.get("/:handle", async (req, res) => {
    try {
      const handle = req.params.handle;
      const product = await appContainer.services.productService.getProductByHandle(handle);
      res.json(product);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  return router;
};

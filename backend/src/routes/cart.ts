import { Router } from "express";
import { AddItemSchema, UpdateQuantitySchema, PromoCodeSchema } from "../validation/cart.js";
import type { AppContainer } from "../app.js";

export const cartRouter = (appContainer: AppContainer) => {
  const router = Router();

  router.post("/", async (_req, res) => {
    try {
      const cartId = `cart_${Date.now()}`;
      const cart = await appContainer.services.cartService.createCart(cartId, "inr");
      res.json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create cart" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const cart = await appContainer.services.cartService.getCart(req.params.id);
      res.json(cart);
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  router.post("/:id/items", async (req, res) => {
    try {
      const cartId = req.params.id;
      const data = AddItemSchema.parse(req.body);

      const productData = await appContainer.repositories.products.findById(data.productId);
      if (!productData) throw new Error("Product not found");
      const variant = productData.variants.find((v) => v.id === data.variantId);
      if (!variant) throw new Error("Variant not found");

      const cart = await appContainer.services.cartService.addItem(cartId, {
        productId: data.productId,
        variantId: data.variantId,
        quantity: data.quantity,
        unitPriceInCents: variant.priceInCents
      });

      res.json(cart);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
        return;
      }
      console.error(error);
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message || "Failed to add item" });
    }
  });

  router.patch("/:id/items/:itemId", async (req, res) => {
    try {
      const data = UpdateQuantitySchema.parse(req.body);
      const cart = await appContainer.services.cartService.updateItemQuantity(
        req.params.id,
        req.params.itemId,
        data.quantity
      );
      res.json(cart);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
        return;
      }
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  router.delete("/:id/items/:itemId", async (req, res) => {
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

  router.post("/:id/promo", async (req, res) => {
    try {
      const data = PromoCodeSchema.parse(req.body);
      const cart = await appContainer.services.cartService.applyPromoCode(req.params.id, data.code);
      res.json(cart);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
        return;
      }
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({ error: error.message });
    }
  });

  return router;
};

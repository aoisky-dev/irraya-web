import { z } from "zod";

export const AddItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().positive("Quantity must be positive")
});

export const UpdateQuantitySchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be 0 or positive")
});

export const PromoCodeSchema = z.object({
  code: z.string().min(1, "Promo code is required")
});

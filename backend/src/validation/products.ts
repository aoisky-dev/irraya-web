import { z } from "zod";

export const ProductFilterSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  minPrice: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined),
  maxPrice: z.string().regex(/^\d+$/).optional().transform(val => val ? parseInt(val) : undefined)
});

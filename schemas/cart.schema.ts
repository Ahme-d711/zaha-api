import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  size: z.string().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  size: z.string().optional(),
  quantity: z.coerce.number().int().min(1),
});

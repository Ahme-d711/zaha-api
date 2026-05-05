import { z } from "zod";

export const createReviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.coerce.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  comment: z.string().max(300, "Comment cannot exceed 300 characters").optional(),
});

export const updateReviewSchema = createReviewSchema.partial().omit({ productId: true });

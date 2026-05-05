import { z } from "zod";

export const topupSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().optional(),
});

export const queryTransactionSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

import { z } from "zod";

export const createAdSchema = z.object({
  nameAr: z.string().min(1, "Arabic name is required").max(100),
  nameEn: z.string().min(1, "English name is required").max(100),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  priority: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().optional().default(0)
  ),
  isShown: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().default(true)
  ),
  link: z.string().optional(),
  productId: z.string().optional(),
});

export const updateAdSchema = createAdSchema.partial();

export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;

export const getAdsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  isShown: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional()
  ),
});

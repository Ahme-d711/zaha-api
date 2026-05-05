import { z } from "zod";

export const createSubcategorySchema = z.object({
  nameAr: z.string().min(1, "Arabic name is required").max(100),
  nameEn: z.string().min(1, "English name is required").max(100),
  categoryId: z.string().min(1, "Category ID is required"),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
  priority: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().int().optional().default(0)
  ),
  image: z.string().optional(),
  isShow: z.preprocess(
    (val) => val === "true" || val === true,
    z.boolean().default(true)
  ),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export type CreateSubcategoryInput = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryInput = z.infer<typeof updateSubcategorySchema>;

export const getSubcategoriesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isShow: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional()
  ),
  isDeleted: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional()
  ),
});

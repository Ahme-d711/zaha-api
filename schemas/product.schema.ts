import { z } from "zod";

const parseJsonString = <T>(val: unknown, fallback: T): T => {
  if (typeof val !== "string") return (val as T) ?? fallback;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
};

const productShape = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.preprocess(
    (val) => (val === undefined || val === null ? "" : String(val)),
    z.string().max(5000)
  ),
  price: z.coerce.number().min(0),
  old_price: z.coerce.number().min(0),
  discount_percentage: z.coerce.number().min(0).max(100),
  rating: z.coerce.number().min(0).max(5),
  reviews_count: z.coerce.number().int().min(0),
  images: z.preprocess(
    (val) => parseJsonString<{ main: string; gallery: string[] }>(val, { main: "", gallery: [] }),
    z.object({
      main: z.string().min(1),
      gallery: z.array(z.string()).default([]),
    })
  ),
  stock: z.coerce.number().int().min(0),
  is_best_seller: z.preprocess((val) => val === "true" || val === true, z.boolean()),
  features: z.preprocess(
    (val) =>
      parseJsonString<{ battery_life: string; noise_cancelling: boolean; audio: string[] }>(val, {
        battery_life: "",
        noise_cancelling: false,
        audio: [],
      }),
    z.object({
      battery_life: z.string().min(1),
      noise_cancelling: z.boolean(),
      audio: z.array(z.string()),
    })
  ),
  shipping: z.preprocess(
    (val) =>
      parseJsonString<{ free_shipping: boolean; condition: string }>(val, {
        free_shipping: false,
        condition: "",
      }),
    z.object({
      free_shipping: z.boolean(),
      condition: z.string().min(1),
    })
  ),
  warranty: z.string().min(1),
  returns: z.string().min(1),
  categoryId: z.string().min(1),
});

export const createProductSchema = productShape;

export const updateProductSchema = productShape.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const queryProductSchema = z
  .object({
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    sort: z.string().optional(),
    /** Filter products by category (MongoDB ObjectId string) */
    categoryId: z.string().optional(),
    is_best_seller: z.preprocess(
      (v) => (v === undefined || v === "" ? undefined : v === "true" || v === true),
      z.boolean().optional()
    ),
  })
  /** Allow ApiFeatures operator keys e.g. stock[gte], price[gte] */
  .passthrough();

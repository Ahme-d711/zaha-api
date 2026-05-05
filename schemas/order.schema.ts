import { z } from "zod";

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
]);

export const paymentMethodSchema = z.enum(["COD", "CARD", "PAYPAL", "WALLET"]);
export const paymentStatusSchema = z.enum(["PENDING", "PAID", "FAILED"]);

export const orderItemSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
  price: z.number().min(0),
  quantity: z.number().int().min(1),
  image: z.string().optional(),
  size: z.string().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  recipientName: z.string().min(1),
  recipientPhone: z.string().min(1),
  shippingAddress: z.string().min(1),
  city: z.string().min(1),
  governorate: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().optional(),
  customerNotes: z.string().optional(),
  paymentMethod: paymentMethodSchema.default("COD"),
  paymentStatus: paymentStatusSchema.optional(),
});

export const updateOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  transactionId: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCompany: z.string().optional(),
  shippedAt: z.string().optional(),
  deliveredAt: z.string().optional(),
  adminNotes: z.string().optional(),
  recipientName: z.string().optional(),
  recipientPhone: z.string().optional(),
  shippingAddress: z.string().optional(),
  city: z.string().optional(),
  governorate: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export const queryOrderSchema = z.object({
  status: orderStatusSchema.optional(),
  /** When "processing", backend matches PENDING | CONFIRMED | PROCESSING */
  group: z.enum(["processing"]).optional(),
  paymentStatus: paymentStatusSchema.optional(),
  userId: z.string().optional(),
  search: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

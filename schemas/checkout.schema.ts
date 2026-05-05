import { z } from "zod";
import { paymentMethodSchema } from "./order.schema.js";

export const checkoutSchema = z.object({
  recipientName: z.string().min(1, "Name is required").max(500),
  recipientPhone: z.string().min(1, "Phone is required").max(20),
  shippingAddress: z.string().min(1, "Address is required").max(500),
  city: z.string().min(1, "City is required").max(200),
  governorate: z.string().min(1, "Governorate is required").max(200),
  country: z.string().min(1, "Country is required").max(200),
  postalCode: z.string().optional(),
  customerNotes: z.string().max(1000).optional(),
  paymentMethod: paymentMethodSchema.default("COD"),
});

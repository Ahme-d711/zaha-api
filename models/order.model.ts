import { Schema, model } from "mongoose";
import { IOrder } from "../types/order.type.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - name
 *         - price
 *         - quantity
 *       properties:
 *         productId: { type: string }
 *         name: { type: string }
 *         price: { type: number }
 *         quantity: { type: number }
 *         image: { type: string }
 *     Order:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *         - recipientName
 *         - recipientPhone
 *         - shippingAddress
 *         - totalAmount
 *       properties:
 *         id: { type: string }
 *         userId: { type: string }
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderItem'
 *         recipientName: { type: string }
 *         recipientPhone: { type: string }
 *         shippingAddress: { type: string }
 *         city: { type: string }
 *         governorate: { type: string }
 *         totalAmount: { type: number }
 *         paymentMethod: { type: string, enum: [COD, CARD, PAYPAL] }
 *         paymentStatus: { type: string, enum: [PENDING, PAID, FAILED] }
 *         status: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED] }
 */

const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: {
          type: String,
          required: false,
        },
        size: {
          type: String,
          required: false,
        },
      },
    ],
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientPhone: {
      type: String,
      required: true,
      trim: true,
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    governorate: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: false,
      trim: true,
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    shippingCost: {
      type: Number,
      required: true,
      default: 0,
    },
    taxRate: {
      type: Number,
      required: true,
      default: 0,
    },
    taxAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "CARD", "PAYPAL", "WALLET"],
      required: true,
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED"],
      default: "PENDING",
      required: true,
    },
    transactionId: {
      type: String,
      required: false,
    },
    trackingNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    shippingCompany: {
      type: String,
      required: false,
    },
    shippedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"],
      default: "PENDING",
      required: true,
    },
    customerNotes: {
      type: String,
      required: false,
    },
    adminNotes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });

export const OrderModel = model<IOrder>("orders", OrderSchema);

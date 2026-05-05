import { Schema, model } from "mongoose";
import { ICart } from "../types/cart.type.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId: { type: string }
 *         quantity: { type: number }
 *     Cart:
 *       type: object
 *       required:
 *         - userId
 *         - items
 *       properties:
 *         id: { type: string }
 *         userId: { type: string }
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 */

const CartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "products",
          required: true,
        },
        size: {
          type: String,
          required: false,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const CartModel = model<ICart>("carts", CartSchema);

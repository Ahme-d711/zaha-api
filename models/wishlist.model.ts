import { Schema, model } from "mongoose";
import { IWishlist } from "../types/wishlist.type.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Wishlist:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         id: { type: string }
 *         userId: { type: string }
 *         products:
 *           type: array
 *           items:
 *             type: string
 *             description: Product code ID
 */

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "products",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const WishlistModel = model<IWishlist>("wishlists", WishlistSchema);

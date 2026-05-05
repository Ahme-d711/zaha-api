import { Request, Response } from "express";
import { WishlistModel } from "../models/wishlist.model.js";
import { toggleWishlistSchema } from "../schemas/wishlist.schema.js";
import AppError from "../errors/AppError.js";
import { ProductModel } from "../models/product.model.js";
import { Types } from "mongoose";

/**
 * Get user wishlist
 */
export const getWishlist = async (req: Request, res: Response) => {
  const userId = req.user?._id;

  let wishlist = await WishlistModel.findOne({ userId }).populate({
    path: "products",
    select: "name price images old_price rating reviews_count categoryId slug stock is_best_seller",
  });

  if (!wishlist) {
    wishlist = await WishlistModel.create({ userId, products: [] });
  }

  res.status(200).json({
    success: true,
    message: "Wishlist fetched successfully",
    data: { wishlist },
  });
};

/**
 * Toggle product in wishlist (Add/Remove)
 */
export const toggleWishlistItem = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { productId } = toggleWishlistSchema.parse(req.body);

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  let wishlist = await WishlistModel.findOne({ userId });

  if (!wishlist) {
    wishlist = new WishlistModel({ userId, products: [] });
  }

  const prodId = new Types.ObjectId(productId);
  const itemIndex = wishlist.products.findIndex((id) => id.toString() === productId);

  let message = "";
  if (itemIndex > -1) {
    // Remove if exists
    wishlist.products.splice(itemIndex, 1);
    message = "Product removed from wishlist";
  } else {
    // Add if not exists
    wishlist.products.push(prodId);
    message = "Product added to wishlist";
  }

  await wishlist.save();

  res.status(200).json({
    success: true,
    message,
    data: { wishlist },
  });
};

/**
 * Clear wishlist
 */
export const clearWishlist = async (req: Request, res: Response) => {
  const userId = req.user?._id;

  const wishlist = await WishlistModel.findOne({ userId });
  if (!wishlist) {
    throw new AppError("Wishlist not found", 404);
  }

  wishlist.products = [];
  await wishlist.save();

  res.status(200).json({
    success: true,
    message: "Wishlist cleared successfully",
    data: { wishlist },
  });
};

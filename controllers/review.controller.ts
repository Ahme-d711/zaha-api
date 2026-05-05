import { Request, Response } from "express";
import { ReviewModel } from "../models/review.model.js";
import { createReviewSchema, updateReviewSchema } from "../schemas/review.schema.js";
import AppError from "../errors/AppError.js";
import { ProductModel } from "../models/product.model.js";

/**
 * Get reviews for a product
 */
export const getProductReviews = async (req: Request, res: Response) => {
  const { productId } = req.params;

  const reviews = await ReviewModel.find({ productId })
    .populate("userId", "name picture")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Reviews fetched successfully",
    data: { reviews },
  });
};

/**
 * Get top reviews for homepage
 */
export const getTopReviews = async (req: Request, res: Response) => {
  let reviews = await ReviewModel.find({ rating: 5 })
    .populate("userId", "name picture")
    .populate("productId", "nameEn nameAr isShow isDeleted")
    .sort({ createdAt: -1 });

  // Filter out reviews where product is missing, deleted, or hidden
  // We need to cast check because populate replaces ObjectId with Document
  reviews = reviews.filter(
    (review) => {
      const product = review.productId as unknown as { isShow: boolean; isDeleted: boolean } | null;
      return product && product.isShow && !product.isDeleted;
    }
  ).slice(0, 6);

  res.status(200).json({
    success: true,
    message: "Top reviews fetched successfully",
    data: { reviews },
  });
};

/**
 * Add a review
 */
export const addReview = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { productId, rating, comment } = createReviewSchema.parse(req.body);

  // Check if product exists
  const product = await ProductModel.findById(productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Check if user already reviewed this product
  const existingReview = await ReviewModel.findOne({ userId, productId });
  if (existingReview) {
    throw new AppError("You have already reviewed this product", 400);
  }

  const review = await ReviewModel.create({
    userId,
    productId,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    message: "Review added successfully",
    data: { review },
  });
};

/**
 * Update a review
 */
export const updateReview = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;
  const validatedBody = updateReviewSchema.parse(req.body);

  const review = await ReviewModel.findOne({ _id: id, userId });
  if (!review) {
    throw new AppError("Review not found or unauthorized", 404);
  }

  const updatedReview = await ReviewModel.findByIdAndUpdate(
    id,
    { ...validatedBody },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: "Review updated successfully",
    data: { review: updatedReview },
  });
};

/**
 * Delete a review
 */
export const deleteReview = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { id } = req.params;

  const review = await ReviewModel.findOneAndDelete({ _id: id, userId });
  if (!review) {
    throw new AppError("Review not found or unauthorized", 404);
  }

  res.status(200).json({
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
};

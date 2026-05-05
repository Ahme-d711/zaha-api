import { Schema, model, Types, Model } from "mongoose";
import { IReview } from "../types/review.type.js";
import { ProductModel } from "./product.model.js";

interface IReviewModel extends Model<IReview> {
  calculateAverageRating(productId: Types.ObjectId): Promise<void>;
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - userId
 *         - productId
 *         - rating
 *       properties:
 *         id: { type: string }
 *         userId: { type: string }
 *         productId: { type: string }
 *         rating: { type: number, minimum: 1, maximum: 5 }
 *         comment: { type: string, maxLength: 300 }
 */

const ReviewSchema = new Schema<IReview, IReviewModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "products",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
      trim: true,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent user from submitting more than one review per product
ReviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Static method to calculate average rating
ReviewSchema.statics.calculateAverageRating = async function (productId: Types.ObjectId) {
  const stats = await this.aggregate([
    {
      $match: { productId },
    },
    {
      $group: {
        _id: "$productId",
        numReviews: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await ProductModel.findByIdAndUpdate(productId, {
      reviews_count: stats[0].numReviews,
      rating: Math.round(stats[0].averageRating * 10) / 10, // Round to 1 decimal
    });
  } else {
    await ProductModel.findByIdAndUpdate(productId, {
      reviews_count: 0,
      rating: 0,
    });
  }
};

// Call calculateAverageRating after save
ReviewSchema.post("save", async function () {
  await (this.constructor as IReviewModel).calculateAverageRating(this.productId);
});

// Call calculateAverageRating before remove (using findOneAndDelete)
ReviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await (model<IReview, IReviewModel>("reviews")).calculateAverageRating(doc.productId);
  }
});

// For updates (findOneAndUpdate)
ReviewSchema.post("findOneAndUpdate", async function (doc) {
    if (doc) {
      await (model<IReview, IReviewModel>("reviews")).calculateAverageRating(doc.productId);
    }
});

export const ReviewModel = model<IReview, IReviewModel>("reviews", ReviewSchema);

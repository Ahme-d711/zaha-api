import { Schema, model } from "mongoose";
import { IProduct } from "../types/product.type.js";
import { slugify } from "../utils/string.utils.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - nameAr
 *         - nameEn
 *         - price
 *         - stock
 *         - categoryId
 *         - mainImage
 *       properties:
 *         id:
 *           type: string
 *         nameAr:
 *           type: string
 *         nameEn:
 *           type: string
 *         descriptionAr:
 *           type: string
 *         descriptionEn:
 *           type: string
 *         price:
 *           type: number
 *         oldPrice:
 *           type: number
 *         costPrice:
 *           type: number
 *         stock:
 *           type: number
 *         sku:
 *           type: string
 *         slug:
 *           type: string
 *         mainImage:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         categoryId:
 *           type: string
 *         subCategoryId:
 *           type: string
 *         sectionIds:
 *           type: array
 *           items:
 *             type: string
 *         averageRating:
 *           type: number
 *         numReviews:
 *           type: number
 */

const ProductSchema = new Schema<IProduct>(
  {
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    old_price: { type: Number, required: true, min: 0 },
    discount_percentage: { type: Number, required: true, min: 0, max: 100 },
    rating: { type: Number, required: true, min: 0, max: 5, default: 0 },
    reviews_count: { type: Number, required: true, min: 0, default: 0 },
    images: {
      main: { type: String, required: true, trim: true },
      gallery: { type: [String], default: [] },
    },
    stock: { type: Number, required: true, min: 0, default: 0 },
    is_best_seller: { type: Boolean, required: true, default: false },
    features: {
      battery_life: { type: String, required: true, trim: true },
      noise_cancelling: { type: Boolean, required: true, default: false },
      audio: { type: [String], default: [] },
    },
    shipping: {
      free_shipping: { type: Boolean, required: true, default: false },
      condition: { type: String, required: true, trim: true },
    },
    warranty: { type: String, required: true, trim: true },
    returns: { type: String, required: true, trim: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "categories",
      required: true,
    },
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    isDeleted: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ProductSchema.pre("validate", async function () {
  if (this.isModified("name")) {
    const baseSlug = slugify(this.name);
    let slug = baseSlug;
    let count = 0;
    
    // Check if slug already exists (excluding the current document)
    while (await model("products").findOne({ slug, _id: { $ne: this._id } })) {
      count++;
      slug = `${baseSlug}-${count}`;
    }
    
    this.slug = slug;
  }
});

// Backward-compatible virtual aliases used by older controllers/views.
ProductSchema.virtual("nameEn")
  .get(function (this: IProduct) {
    return this.name;
  })
  .set(function (this: IProduct, value: string) {
    this.name = value;
  });

ProductSchema.virtual("nameAr")
  .get(function (this: IProduct) {
    return this.name;
  })
  .set(function (this: IProduct, value: string) {
    this.name = value;
  });

ProductSchema.virtual("descriptionEn")
  .get(function (this: IProduct) {
    return this.description ?? "";
  })
  .set(function (this: IProduct, value: string) {
    this.description = value;
  });

ProductSchema.virtual("descriptionAr")
  .get(function (this: IProduct) {
    return this.description ?? "";
  })
  .set(function (this: IProduct, value: string) {
    this.description = value;
  });

ProductSchema.virtual("mainImage")
  .get(function (this: IProduct) {
    return this.images?.main;
  })
  .set(function (this: IProduct, value: string) {
    this.images = { ...(this.images ?? { gallery: [] }), main: value };
  });

ProductSchema.virtual("isShow")
  .get(function (this: IProduct) {
    return this.is_best_seller;
  })
  .set(function (this: IProduct, value: boolean) {
    this.is_best_seller = value;
  });

ProductSchema.virtual("averageRating")
  .get(function (this: IProduct) {
    return this.rating;
  })
  .set(function (this: IProduct, value: number) {
    this.rating = value;
  });

ProductSchema.virtual("numReviews")
  .get(function (this: IProduct) {
    return this.reviews_count;
  })
  .set(function (this: IProduct, value: number) {
    this.reviews_count = value;
  });

ProductSchema.index({ name: "text" });
ProductSchema.index({ isDeleted: 1 });
ProductSchema.index({ is_best_seller: 1 });
ProductSchema.index({ addedBy: 1 });
ProductSchema.index({ createdAt: -1 });

export const ProductModel = model<IProduct>("products", ProductSchema);

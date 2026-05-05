import { Schema, model } from "mongoose";
import { ICategory } from "../types/category.type.js";
import { slugify } from "../utils/string.utils.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         slug:
 *           type: string
 *         image:
 *           type: string
 *         priority:
 *           type: number
 *         isShow:
 *           type: boolean
 */

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    priority: {
      type: Number,
      required: true,
      default: 0,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    image: {
      type: String,
      required: false,
      trim: true,
    },
    isShow: {
      type: Boolean,
      required: true,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

CategorySchema.virtual("subcategoriesCount", {
  ref: "subcategories",
  localField: "_id",
  foreignField: "categoryId",
  count: true,
  match: { isDeleted: false },
});

CategorySchema.virtual("productsCount", {
  ref: "products",
  localField: "_id",
  foreignField: "categoryId",
  count: true,
  match: { isDeleted: false },
});

CategorySchema.pre("validate", async function (this: any) {
  if (this.isModified("name")) {
    const baseSlug = slugify(this.name);
    let slug = baseSlug;
    let count = 0;
    
    // Check if slug already exists (excluding the current document)
    while (await model("categories").findOne({ slug, _id: { $ne: this._id } })) {
      count++;
      slug = `${baseSlug}-${count}`;
    }
    
    this.slug = slug;
  }
});

CategorySchema.index({ name: 1 });
CategorySchema.index({ isShow: 1 });
CategorySchema.index({ isDeleted: 1 });
CategorySchema.index({ priority: -1 });

export const CategoryModel = model<ICategory>("categories", CategorySchema);

import mongoose, { type Document } from "mongoose";

export interface ISubcategory extends Document {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  priority: number;
  slug: string;
  categoryId: mongoose.Types.ObjectId | string;
  image?: string;
  isShow: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

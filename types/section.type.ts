import { type Document } from "mongoose";

export interface ISection extends Document {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  priority: number;
  slug: string;
  image?: string;
  isShow: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

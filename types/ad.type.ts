import { Document } from "mongoose";

export interface IAd extends Document {
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  photo: string;
  mobilePhoto?: string;
  isShown: boolean;
  priority: number;
  link?: string;
  productId?: string;
  createdAt: Date;
  updatedAt: Date;
}

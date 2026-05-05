import { type Document, Types } from "mongoose";

export interface ProductImages {
  main: string;
  gallery: string[];
}

export interface ProductFeatures {
  battery_life: string;
  noise_cancelling: boolean;
  audio: string[];
}

export interface ProductShipping {
  free_shipping: boolean;
  condition: string;
}

export interface IProduct extends Document {
  id: string;
  name: string;
  /** Primary product copy shown on detail pages */
  description: string;
  price: number;
  old_price: number;
  discount_percentage: number;
  rating: number;
  reviews_count: number;
  images: ProductImages;
  stock: number;
  is_best_seller: boolean;
  features: ProductFeatures;
  shipping: ProductShipping;
  warranty: string;
  returns: string;
  slug: string;
  isDeleted: boolean;
  categoryId: Types.ObjectId | string;
  addedBy: Types.ObjectId | string;

  // Legacy compatibility fields used in older controllers.
  nameEn?: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  mainImage?: string;
  isShow?: boolean;
  averageRating?: number;
  numReviews?: number;
  soldCount?: number;
  sizes?: {
    size: string;
    stock: number;
    price: number;
    oldPrice?: number;
    costPrice?: number;
  }[];

  createdAt?: Date;
  updatedAt?: Date;
}

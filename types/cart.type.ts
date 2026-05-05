import { Document, Types } from "mongoose";
import { IProduct } from "./product.type.js";

export interface ICartItem {
  productId: Types.ObjectId;
  quantity: number;
  size?: string;
}

export interface ICartItemPopulated {
  productId: IProduct;
  quantity: number;
  size?: string;
}

export interface ICart extends Document {
  userId: Types.ObjectId;
  items: ICartItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICartPopulated extends Document {
  userId: Types.ObjectId;
  items: ICartItemPopulated[];
  createdAt: Date;
  updatedAt: Date;
}

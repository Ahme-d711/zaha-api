import { Document, Types } from "mongoose";

export interface IWishlist extends Document {
  userId: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

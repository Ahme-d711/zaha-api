import { Document, Types } from "mongoose";

export interface IReview extends Document {
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

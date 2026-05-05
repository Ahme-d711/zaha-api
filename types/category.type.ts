import { type Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  description?: string;
  priority: number;
  slug: string;
  image?: string;
  isShow: boolean;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

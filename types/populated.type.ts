import { type Schema } from "mongoose";

/**
 * Utility type to represent a field that can be either an ObjectId or a populated object.
 */
export type Populated<T, P> = T | P;

/**
 * Example usage:
 * interface ICategory { nameAr: string; nameEn: string; }
 * interface ISubcategory { categoryId: Populated<Schema.Types.ObjectId, ICategory>; }
 */

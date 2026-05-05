import { type Document } from "mongoose";


export const USER_ROLES = ["admin", "user", "vendor", "super_admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  picture?: string;
  gender?: "male" | "female";
  isActive?: boolean;
  isVerified?: boolean;
  isBlocked?: boolean;
  phone?: string;
  address?: string;
  totalOrders?: number;
  totalBalance?: number;
  lastLoginAt?: Date;
  lastTransactionAt?: Date;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordCode?: string;
  resetPasswordCodeExpires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
import { IUser, USER_ROLES } from '../types/user.type.js';
import { Schema, model } from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The user's full name
 *         email:
 *           type: string
 *           description: The user's email address
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: The user's role
 *         picture:
 *           type: string
 *           description: URL to user's profile picture
 *         gender:
 *           type: string
 *           enum: [male, female]
 *           description: The user's gender
 *         phone:
 *           type: string
 *           description: User's phone number
 *         walletBalance:
 *           type: number
 *           description: Current balance in user's wallet
 *         resetPasswordCode:
 *           type: string
 *           description: Code for password reset
 *         resetPasswordCodeExpires:
 *           type: string
 *           format: date-time
 *           description: Expiration time for password reset code
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation date
 */

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 500,
    },
    password: {
      type: String,
      required: false,
      maxlength: 255,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: true,
      default: "user",
    },
    picture: {
      type: String,
      required: false,
      trim: true,
      maxlength: 255,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: null,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      maxlength: 20,
    },
    address: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    totalOrders: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    totalBalance: {
      type: Number,
      required: false,
      default: 0,
      min: 0,
    },
    lastLoginAt: {
      type: Date,
      required: false,
    },
    lastTransactionAt: {
      type: Date,
      required: false,
    },
    isBlocked: {
      type: Boolean,
      required: false,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: false,
      default: true,
    },
    isVerified: {
      type: Boolean,
      required: false,
      default: false,
    },
    verificationCode: {
      type: String,
      required: false,
    },
    verificationCodeExpires: {
      type: Date,
      required: false,
    },
    resetPasswordCode: {
      type: String,
      required: false,
    },
    resetPasswordCodeExpires: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ isActive: 1 }); // Index for filtering active users

export const UserModel = model<IUser>("users", UserSchema);

import type { Request, Response } from "express";
import { UserModel } from "../models/user.model.js";
import { OrderModel } from "../models/order.model.js";
import { sendResponse } from "../utils/sendResponse.js";
import AppError from "../errors/AppError.js";
import bcrypt from "bcryptjs";
import { deleteFile } from "../utils/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  updateUserBlockSchema,
  updateUserBalanceSchema,
  validateUserData,
} from "../schemas/user.schema.js";
import ApiFeatures from "../utils/ApiFeatures.js";
import type { IUser } from "../types/user.type.js";

/**
 * Helper function to check if email already exists
 */
const checkEmailExists = async (email: string, excludeId?: string | string[]): Promise<void> => {
  const filter: { email: string; _id?: { $ne: string } } = { email: email.toLowerCase() };
  if (excludeId) {
    const id = Array.isArray(excludeId) ? excludeId[0] : excludeId;
    if (id) {
      filter._id = { $ne: id };
    }
  }

  const existingUser = await UserModel.findOne(filter);
  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }
};

/**
 * Helper function to check if phone already exists
 */
const checkPhoneExists = async (phone: string | undefined, excludeId?: string | string[]): Promise<void> => {
  if (!phone) return;

  const filter: { phone: string; _id?: { $ne: string } } = { phone };
  if (excludeId) {
    const id = Array.isArray(excludeId) ? excludeId[0] : excludeId;
    if (id) {
      filter._id = { $ne: id };
    }
  }

  const existingPhone = await UserModel.findOne(filter);
  if (existingPhone) {
    throw new AppError("User with this phone number already exists", 409);
  }
};

/**
 * Helper function to convert Express query to ApiFeatures QueryParams
 */
const convertQueryToParams = (query: Request["query"]): Record<string, string | number | boolean | undefined> => {
  const params: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      params[key] = value;
    } else if (Array.isArray(value) && value.length > 0) {
      params[key] = value.map(v => String(v)).join(',');
    }
  }
  return params;
};

/**
 * Get all users with filtering, searching, and pagination
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const validatedQuery = validateUserData(getUsersQuerySchema, req.query);
  const query = UserModel.find({ role: { $ne: "admin" } }).select("-password").sort({ createdAt: -1 });

  const apiFeatures = new ApiFeatures(query, validatedQuery as Record<string, unknown>)
    .filter()
    .search(["name", "email"])
    .paginate();

  const { results: users, pagination } = await apiFeatures.execute();

  // Fetch true order counts for each user
  const usersWithOrderCount = await Promise.all(
    users.map(async (user) => {
      const orderCount = await OrderModel.countDocuments({ userId: user._id });
      const userObj = user.toObject();
      return { ...userObj, totalOrders: orderCount };
    })
  );

    sendResponse(res, 200, {
      success: true,
      message: "Users retrieved successfully",
      data: {
        users: usersWithOrderCount,
      pagination,
      },
    });
});

/**
 * Get single user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

  const user = await UserModel.findById(id).select("-password");

    if (!user) {
    throw new AppError("User not found", 404);
    }

    // Fetch true order count
    const totalOrders = await OrderModel.countDocuments({ userId: user._id });
    const userObj = user.toObject();

    sendResponse(res, 200, {
      success: true,
    message: "User retrieved successfully",
      data: { 
        user: { ...userObj, totalOrders } 
      },
    });
});

/**
 * Create new user
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = validateUserData(createUserSchema, req.body);
    const file = req.file;

  // Check for existing email and phone
  await checkEmailExists(validatedData.email);
  await checkPhoneExists(validatedData.phone);

    // Hash password if provided
  const hashedPassword = validatedData.password
    ? await bcrypt.hash(validatedData.password, 10)
    : undefined;

  // Get picture path
  const picturePath = file
    ? `/uploads/users/${file.filename}`
    : validatedData.picture;

  try {
    const user = await UserModel.create({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      password: hashedPassword,
      phone: validatedData.phone,
      picture: picturePath,
      role: validatedData.role,
      isActive: validatedData.isActive,
      isVerified: validatedData.isVerified,
      address: validatedData.address,
      totalOrders: validatedData.totalOrders,
      totalBalance: validatedData.totalBalance,
      lastLoginAt: validatedData.lastLoginAt,
      lastTransactionAt: validatedData.lastTransactionAt,
    });

    // Return user without password (no need for additional query)
    const { password: _, ...userResponse } = user.toObject();

    sendResponse(res, 201, {
      success: true,
      message: "User created successfully",
      data: { user: userResponse },
    });
  } catch (error) {
    // Cleanup uploaded file on error
    if (file) {
      try {
        await deleteFile(`/uploads/users/${file.filename}`);
      } catch (err) {
        console.error("Failed to cleanup uploaded file:", err);
    }
    }
    throw error;
  }
});

/**
 * Update user
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
  const validatedData = validateUserData(updateUserSchema, req.body);
    const file = req.file;

    const user = await UserModel.findById(id);

    if (!user) {
    throw new AppError("User not found", 404);
    }

  // Check if email is being changed
  if (validatedData.email && validatedData.email.toLowerCase() !== user.email) {
    const userId = Array.isArray(id) ? id[0] : id;
    await checkEmailExists(validatedData.email, userId);
    }

  // Check if phone is being changed
  if (validatedData.phone && validatedData.phone !== user.phone) {
    const userId = Array.isArray(id) ? id[0] : id;
    await checkPhoneExists(validatedData.phone, userId);
    }

    // Hash password if provided
    if (validatedData.password) {
      validatedData.password = await bcrypt.hash(validatedData.password, 10);
    }

  // Handle picture update
  let picturePath = user.picture;
    if (file) {
    // Delete old picture if exists
    if (user.picture && !user.picture.startsWith("http")) {
        try {
        await deleteFile(user.picture);
        } catch (err) {
        console.error("Failed to delete old picture:", err);
      }
    }
    picturePath = `/uploads/users/${file.filename}`;
  } else if (validatedData.picture) {
    picturePath = validatedData.picture;
    }

  // Update user fields
    Object.assign(user, {
      ...validatedData,
      ...(validatedData.email && { email: validatedData.email.toLowerCase() }),
    ...(file && { picture: picturePath }),
    ...(validatedData.picture && !file && { picture: picturePath }),
    });

    await user.save();

  // Return updated user without password (no need for additional query)
  const { password: _, ...userResponse } = user.toObject();

    sendResponse(res, 200, {
      success: true,
    message: "User updated successfully",
    data: { user: userResponse },
    });
});

/**
 * Delete user (soft delete - sets isActive to false)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    // Prevent users from deleting themselves
  if (req.user && req.user._id === id) {
    throw new AppError("You cannot delete your own account", 400);
    }

    const user = await UserModel.findById(id);

    if (!user) {
    throw new AppError("User not found", 404);
    }

  // Soft delete: set isActive to false
  user.isActive = false;
  await user.save();

  // Delete associated picture if exists
  if (user.picture && !user.picture.startsWith("http")) {
      try {
      await deleteFile(user.picture);
      } catch (err) {
      console.error("Failed to delete picture:", err);
      }
    }

    sendResponse(res, 200, {
      success: true,
    message: "User deactivated successfully",
    });
});

/**
 * Get current user profile
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
    throw new AppError("You must be logged in to perform this action", 401);
    }

  // Fetch fresh user data from database
  const user = await UserModel.findOne({
    _id: req.user._id,
    isActive: true,
  }).select("-password");

    if (!user) {
    throw new AppError("User not found or account is deactivated", 404);
    }

    sendResponse(res, 200, {
      success: true,
    message: "User data retrieved successfully",
      data: { user },
    });
});

/**
 * Update user block status (isBlocked: true/false)
 */
export const updateUserBlockStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isBlocked } = validateUserData(updateUserBlockSchema, req.body);

  const user = await UserModel.findByIdAndUpdate(
    id,
    { isBlocked },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

    sendResponse(res, 200, {
      success: true,
    message: isBlocked ? "User blocked successfully" : "User unblocked successfully",
    data: { user },
    });
});

/**
 * Update user balance (add balance)
 */
export const updateUserBalance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount } = validateUserData(updateUserBalanceSchema, req.body);

  const user = await UserModel.findById(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Update totalBalance
  user.totalBalance = (user.totalBalance || 0) + amount;
  user.lastTransactionAt = new Date();
  
  await user.save();

  // Return updated user without password
  const { password: _, ...userResponse } = user.toObject();

  sendResponse(res, 200, {
    success: true,
    message: `Successfully added ${amount} to user balance`,
    data: { user: userResponse },
  });
});

/**
 * Activate user (sets isActive to true)
 */
export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await UserModel.findById(id);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  user.isActive = true;
  await user.save();

  // Return updated user without password
  const { password: _, ...userResponse } = user.toObject();

  sendResponse(res, 200, {
    success: true,
    message: "User activated successfully",
    data: { user: userResponse },
  });
});

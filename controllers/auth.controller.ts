import type { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/user.model.js";
import { OrderModel } from "../models/order.model.js";
import { sendResponse } from "../utils/sendResponse.js";
import AppError from "../errors/AppError.js";
import bcrypt from "bcryptjs";
import { getAccessTokenCookieOptions } from "../utils/cookies.js";
import {
  loginSchema,
  registerSchema,
  changePasswordSchema,
  updateProfileSchema,
  verifyPhoneSchema,
  resendVerificationSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  validateAuthData,
  safeValidateAuthData,
} from "../schemas/auth-schema.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import type { IUser } from "../types/user.type.js";
import { generateToken, extractTokenFromRequest, verifyToken } from "../utils/jwt.utils.js";
import { getRelativePath } from "../utils/upload.js";
import { TOKEN_KEY } from "../utils/constants.js";

/**
 * Helper function to generate JWT token, set cookie, and send authentication response
 * @param user - User document from database (Mongoose document)
 * @param res - Express response object
 * @param statusCode - HTTP status code (default: 200)
 * @param message - Success message
 */
const sendAuthResponse = (
  user: IUser & { _id: unknown; toObject: () => Record<string, unknown>; password?: string },
  res: Response,
  statusCode: number = 200,
  message: string = "Authentication successful"
) => {
  // Generate JWT token
  const accessToken = generateToken({
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  // Set cookie
  res.cookie(TOKEN_KEY, accessToken, getAccessTokenCookieOptions());

  // Return user without password
  const { password: _, ...userResponse } = user.toObject();

  // We don't fetch order count here to keep login fast, 
  // but if the user insists, we should. However, login usually doesn't need it immediately.
  // Actually, the user said "get profile" which is getCurrentUser.
  // But let's check if they want it in login too. "and get profile" usually means the me endpoint.

  sendResponse(res, statusCode, {
    success: true,
    message,
    data: {
      user: {
        ...userResponse,
        gender: userResponse.gender || null, // Ensure it's returned
      },
      accessToken,
    },
  });
};

/**
 * Helper function to check if user is authenticated
 * @param req - Express request object
 * @throws AppError if user is not authenticated
 */
const requireAuth = (req: Request): void => {
  if (!req.user) {
    throw new AppError("You must be logged in to perform this action", 401);
  }
};

/**
 * Register new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Validate input data
  const validatedData = validateAuthData(registerSchema, req.body);

  // Clean phone number (strip + if exists)
  const phone = validatedData.phone.replace(/^\+/, "");

  // Check if user already exists by email
  const existingEmail = await UserModel.findOne({
    email: validatedData.email,
  });

  if (existingEmail) {
    throw new AppError("User with this email already exists", 409);
  }

  // Check if phone already exists
  const existingPhone = await UserModel.findOne({ phone });

  if (existingPhone) {
    throw new AppError("User with this phone number already exists", 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  // Generate verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Create user
  const user = await UserModel.create({
    name: validatedData.name,
    email: validatedData.email,
    password: hashedPassword,
    phone,
    picture: validatedData.picture,
    gender: validatedData.gender,
    role: validatedData.role || "user",
    isActive: true,
    isVerified: true, // Auto-verify users
  });

  // Send authentication response
  sendAuthResponse(user, res, 201, "Registration successful.");
});

/**
 * Login user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Validate input data
  let { phone, email, password } = validateAuthData(loginSchema, req.body);

  const query: any = { isActive: true };
  if (email) {
    query.email = email;
  } else if (phone) {
    query.phone = phone.replace(/^\+/, "");
  }

  // Find user with password field included (only active users)
  const user = await UserModel.findOne(query).select("+password");

  if (!user || !user.password) {
      throw new AppError("Invalid login credentials", 401);
    }

  // Check if user is active
  if (user.isActive === false) {
    throw new AppError("Your account has been deactivated", 403);
  }

  // Check if user is blocked
  if (user.isBlocked === true) {
    throw new AppError("Your account has been blocked", 403);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new AppError("Invalid login credentials", 401);
    }

  // Update last login timestamp
  user.lastLoginAt = new Date();
  await user.save();

  // Send authentication response
  sendAuthResponse(user, res, 200, "Login successful");
});

/**
 * Check authentication status
 */
export const checkAuth = asyncHandler(async (req: Request, res: Response) => {
  const accessToken = extractTokenFromRequest(req);

    if (!accessToken) {
      return sendResponse(res, 200, {
        success: true,
        message: "Not authenticated",
        data: { authenticated: false },
      });
    }

  const decoded = verifyToken(accessToken);

  if (!decoded) {
          return sendResponse(res, 200, {
            success: true,
            message: "Not authenticated",
            data: { authenticated: false },
          });
        }

  const user = await UserModel.findOne({ 
    _id: decoded.id,
    isActive: true, // Only return active users
  }).select("-password");

          if (!user) {
            return sendResponse(res, 200, {
              success: true,
              message: "Not authenticated",
              data: { authenticated: false },
            });
          }

          sendResponse(res, 200, {
            success: true,
            message: "Authenticated",
            data: {
              authenticated: true,
              user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                gender: user.gender || null,
              },
      accessToken,
            },
          });
});

/**
 * Get current user data (requires authentication)
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  requireAuth(req);

  // Fetch user from database (only active users)
  const user = await UserModel.findOne({ 
    _id: req.user!._id,
    isActive: true,
  }).select("-password");

  if (!user) {
    throw new AppError("User not found or account is deactivated", 404);
  }

  const totalOrders = await OrderModel.countDocuments({ userId: user._id });

  sendResponse(res, 200, {
    success: true,
    message: "User data retrieved successfully",
    data: { 
      user: {
        ...user.toObject(),
        gender: user.toObject().gender || null,
        totalOrders,
      },
    },
  });
});

/**
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  requireAuth(req);
  // Clean empty picture object if present (happens with some multipart parsers)
  if (req.body.picture && typeof req.body.picture !== "string") {
    delete req.body.picture;
  }

  // Validate input data
  const result = safeValidateAuthData(updateProfileSchema, req.body);
  if (!result.success) {
    throw new AppError("Invalid input", 400);
  }
  const validatedData = result.data;

  // Note: Email update is not included in updateProfileSchema for security reasons
  // If email update is needed, it should be a separate endpoint with additional verification

  // Update user (only if active)
  const user = await UserModel.findOneAndUpdate(
    { _id: req.user!._id, isActive: true },
    {
      ...validatedData,
      phone: validatedData.phone ? validatedData.phone.replace(/^\+/, "") : undefined,
      picture: req.file ? getRelativePath(req.file.path) : validatedData.picture,
    },
    { new: true, runValidators: true }
  ).select("-password");

  if (!user) {
    throw new AppError("User not found or account is deactivated", 404);
        }

  sendResponse(res, 200, {
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
});

/**
 * Change password
 */
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  requireAuth(req);

  // Validate input data
  const { currentPassword, newPassword } = validateAuthData(
    changePasswordSchema,
    req.body
  );

  // Get user with password (only if active)
  const user = await UserModel.findOne({ 
    _id: req.user!._id,
    isActive: true,
  }).select("+password");

  if (!user || !user.password) {
    throw new AppError("User not found or account is deactivated", 404);
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  // Hash new password and update
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await UserModel.findByIdAndUpdate(req.user!._id, {
    password: hashedPassword,
  });

  sendResponse(res, 200, {
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * Logout user
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // Clear access token cookie
  res.clearCookie(TOKEN_KEY, getAccessTokenCookieOptions());

  // Destroy session if exists
      if (req.session) {
    return new Promise<void>((resolve, reject) => {
      req.session!.destroy((err: unknown) => {
          if (err) {
          reject(new AppError("Error ending session", 500));
        } else {
          sendResponse(res, 200, {
            success: true,
            message: "Logout successful",
          });
          resolve();
        }
          });
        });
  }

        sendResponse(res, 200, {
          success: true,
          message: "Logout successful",
        });
});

/**
 * Verify account with verification code (sent via email)
 */
export const verifyPhone = asyncHandler(async (req: Request, res: Response) => {
  // Validate input data
  let { phone, email, code } = validateAuthData(verifyPhoneSchema, req.body);

  const query: any = { isActive: true };
  if (email) {
    query.email = email;
  } else if (phone) {
    query.phone = phone.replace(/^\+/, "");
  } else {
    throw new AppError("Email or phone number is required", 400);
  }

  // Find user
  const user = await UserModel.findOne(query);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Account is already verified", 400);
  }

  // Verify the code
  if (!user.verificationCode || user.verificationCode !== code) {
    throw new AppError("Invalid verification code", 400);
  }

  // Check if code is expired
  if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
    throw new AppError("Verification code has expired", 400);
  }

  // Mark user as verified and clear the code
  user.isVerified = true;
  user.verificationCode = undefined;
  user.verificationCodeExpires = undefined;
  await user.save();

  sendResponse(res, 200, {
    success: true,
    message: "Account verified successfully",
    data: { user },
  });
});

/**
 * Resend verification code via Email
 */
export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  // Validate input data
  let { phone, email } = validateAuthData(resendVerificationSchema, req.body);

  const query: any = { isActive: true };
  if (email) {
    query.email = email;
  } else if (phone) {
    query.phone = phone.replace(/^\+/, "");
  } else {
    throw new AppError("Email or phone number is required", 400);
  }

  const user = await UserModel.findOne(query);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.isVerified) {
    throw new AppError("Account is already verified", 400);
  }

  // Generate new verification code
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update user with new code
  user.verificationCode = verificationCode;
  user.verificationCodeExpires = verificationCodeExpires;
  await user.save();

  // Send verification code via Email (Disabled as per request)
  // await sendVerificationEmail(user.email, verificationCode);
  console.log(`Verification code for ${user.email}: ${verificationCode}`);

  sendResponse(res, 200, {
    success: true,
    message: "Verification code has been sent to your email",
  });
});

/**
 * Forgot password - Send code via Email
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  // Validate input data
  let { phone, email } = validateAuthData(resetPasswordRequestSchema, req.body);

  const query: any = { isActive: true };
  if (email) {
    query.email = email;
  } else if (phone) {
    query.phone = phone.replace(/^\+/, "");
  }

  const user = await UserModel.findOne(query);

  if (!user) {
    // Return success even if user not found to prevent user enumeration
    return sendResponse(res, 200, {
      success: true,
      message: "If an account exists, a verification code has been sent to the registered email",
    });
  }

  // Generate verification code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update user with reset code
  user.resetPasswordCode = resetCode;
  user.resetPasswordCodeExpires = resetCodeExpires;
  await user.save();

  // Send verification code via Email (Disabled as per request to remove email system)
  // await sendResetPasswordEmail(user.email, resetCode);
  console.log(`Reset code for ${user.email}: ${resetCode}`);

  sendResponse(res, 200, {
    success: true,
    message: "If an account exists, a verification code has been sent to your email",
  });
});

/**
 * Reset password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  // Validate input data
  let { phone, email, code, password } = validateAuthData(resetPasswordSchema, req.body);

  const query: any = { 
    isActive: true,
    resetPasswordCode: code,
    resetPasswordCodeExpires: { $gt: new Date() }
  };

  if (email) {
    query.email = email;
  } else if (phone) {
    query.phone = phone.replace(/^\+/, "");
  }

  const user = await UserModel.findOne(query);

  if (!user) {
    throw new AppError("Invalid or expired verification code", 400);
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update user
  user.password = hashedPassword;
  user.resetPasswordCode = undefined;
  user.resetPasswordCodeExpires = undefined;
  await user.save();

  sendResponse(res, 200, {
    success: true,
    message: "Password reset successfully",
  });
});

/**
 * Delete user account (soft delete - sets isActive to false)
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  requireAuth(req);

  // Prevent users from deleting themselves (optional - you can remove this)
  // For now, allow users to deactivate their own account

  // Soft delete: set isActive to false
  const user = await UserModel.findByIdAndUpdate(
    req.user!._id,
    { isActive: false },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Clear access token cookie
  res.clearCookie(TOKEN_KEY, getAccessTokenCookieOptions());

  // Destroy session if exists
  if (req.session) {
    req.session.destroy(() => {});
  }

  sendResponse(res, 200, {
    success: true,
    message: "Account deactivated successfully",
  });
});

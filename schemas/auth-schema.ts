import { z } from "zod";
import { USER_ROLES } from "../types/user.type.js";

/**
 * Common validation patterns
 */
export const emailSchema = z
  .email("Invalid email format")
  .min(1, "Email is required")
  .max(500, "Email must be less than 500 characters")
  .toLowerCase()
  .trim();

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(255, "Password must be less than 255 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(500, "Name must be less than 500 characters")
  .trim();

/**
 * Phone validation schema
 * Note: Uniqueness is enforced at the database level and checked in the auth controller
 */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .max(20, "Phone number must be less than 20 characters")
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
  .trim();

export const pictureSchema = z
  .url("Picture must be a valid URL")
  .max(255, "Picture URL must be less than 255 characters")
  .optional()
  .or(z.literal(""));

export const roleSchema = z.enum(USER_ROLES as unknown as [string, ...string[]], {
  message: `Role must be one of: ${USER_ROLES.join(", ")}`,
});

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .max(20, "Phone number must be less than 20 characters")
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
    .trim()
    .optional()
    .or(z.literal("")),
  password: z.string().min(1, "Password is required"),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Register/Signup Schema
 */
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    phone: z
      .string()
      .min(1, "Phone number is required")
      .max(20, "Phone number must be less than 20 characters")
      .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, "Invalid phone number format")
      .trim(), // Phone is required for verification
    gender: z.enum(["male", "female"]).optional(),
    picture: pictureSchema,
    role: roleSchema.default("user"),
  })
  .refine(
    (data) => {
      // Admin role can only be assigned by existing admins (handled in controller)
      return true;
    },
    {
      message: "Invalid role assignment",
      path: ["role"],
    }
  );

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Update Profile Schema
 */
export const updateProfileSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema,
  picture: pictureSchema,
  gender: z.enum(["male", "female"]).optional(),
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Change Password Schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Reset Password Request Schema (for forgot password)
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>;

/**
 * Reset Password Schema (with token)
 */
export const resetPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    code: z.string().min(4, "Code is required").max(6, "Code must be 6 digits"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * Verify Phone Schema
 */
export const verifyPhoneSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  code: z.string().min(4, "Verification code must be at least 4 digits").max(6, "Verification code must be at most 6 digits"),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;

/**
 * Resend Verification Code Schema (via SMS)
 */
export const resendVerificationSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
}).refine(data => data.email || data.phone, {
  message: "Either email or phone number is required",
  path: ["email"],
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

/**
 * Update User Role Schema (Admin only)
 */
export const updateUserRoleSchema = z.object({
  role: roleSchema,
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

/**
 * Validation helper function
 */
export function validateAuthData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  return schema.parse(data);
}

/**
 * Safe validation (returns errors instead of throwing)
 */
export function safeValidateAuthData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}


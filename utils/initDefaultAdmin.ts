import { UserModel } from "../models/user.model.js";
import { env } from "../config/env.js";
import bcrypt from "bcryptjs";
import AppError from "../errors/AppError.js";

export async function initDefaultAdmin(): Promise<void> {
  try {
    // Check if the default admin user exists
    const adminExists = await UserModel.findOne({ email: env.defaultAdminEmail.toLowerCase() });

    if (!adminExists) {
      // Validate required environment variables
      if (!env.defaultAdminEmail || !env.defaultAdminPassword) {
        throw new AppError(
          "Admin email and password are required",
          500
        );
      }

      // Hash the default password
      const hashedPassword = await bcrypt.hash(env.defaultAdminPassword, 10);

      // Create default admin user
      try {
        const adminUser = new UserModel({
          name: env.defaultAdminName,
          email: env.defaultAdminEmail.toLowerCase(),
          phone: env.defaultAdminPhone,
          address: env.defaultAdminAddress,
          isVerified: true,
          isActive: true,
          isBlocked:false,
          password: hashedPassword,
          role: "admin",
        });
        await adminUser.save();
      } catch (createError: unknown) {
        if (createError && typeof createError === 'object' && 'code' in createError && createError.code === 11000) {
          throw new AppError("Admin email already exists", 409);
        }
        const errorMessage = createError instanceof Error ? createError.message : "Unknown error";
        throw new AppError(
          `Failed to create admin: ${errorMessage}`,
          500
        );
      }
    } else {
      console.log(`Default admin (${env.defaultAdminEmail}) already exists. Skipping creation.`);
    }
  } catch (error) {
    if (error instanceof AppError) {
      console.error(`❌ Error initializing default admin: ${error.message}`);
    } else {
      console.error("❌ Unexpected error initializing default admin:", error);
    }
  }
}


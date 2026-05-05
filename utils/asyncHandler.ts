import type { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError.js";
import { ZodError } from "zod";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const firstError = error.issues[0];
        return next(
          new AppError(
            firstError?.message || "Validation error",
            400
          )
        );
      }

      // Handle AppError instances
      if (error instanceof AppError) {
        return next(error);
      }

      // Handle unknown errors
      console.error("Unhandled error:", error);
      return next(new AppError("An unexpected error occurred", 500));
    });
  };
};


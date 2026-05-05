import type { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError.js";
import { UserModel } from "../models/user.model.js";
import { extractTokenFromRequest, verifyToken, type JwtPayload } from "../utils/jwt.utils.js";

/**
 * Authenticate user - requires valid token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = extractTokenFromRequest(req);

    if (!accessToken) {
      throw new AppError("You must be logged in to perform this action", 401);
    }

    const decoded = verifyToken(accessToken);

    if (!decoded) {
      throw new AppError("Invalid or expired token", 401);
        }

    const user = await UserModel.findOne({
      _id: decoded.id,
      isActive: true,
    }).select("_id email role name");

          if (!user) {
      throw new AppError("User not found or account is deactivated", 404);
          }

          req.user = {
      _id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
          };

          next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize user - check if user has required role(s)
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("You must be logged in to perform this action", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  };
};

/**
 * Optional authentication - sets req.user if token is valid, but doesn't require it
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessToken = extractTokenFromRequest(req);

    if (!accessToken) {
      return next();
    }

    const decoded = verifyToken(accessToken);

    if (!decoded) {
      // Invalid token, but continue without authentication
      return next();
        }

    const user = await UserModel.findOne({
      _id: decoded.id,
      isActive: true,
    }).select("_id email role name");

    if (user) {
          req.user = {
        _id: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
          };
    }

          next();
  } catch (error) {
    // On error, continue without authentication
    next();
  }
};

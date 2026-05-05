import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Request } from "express";
import { TOKEN_KEY } from "./constants.js";

export interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate JWT access token
 * @param payload - User data to encode in token
 * @returns JWT token string
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
};

/**
 * Verify JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, env.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Extract access token from request (cookies or Authorization header)
 * @param req - Express request object
 * @returns Token string or null if not found
 */
export const extractTokenFromRequest = (req: Request): string | null => {
  return (
    req.cookies?.[TOKEN_KEY] ||
    req.headers.authorization?.replace("Bearer ", "") ||
    null
  );
};


import { env } from "../config/env.js";

export interface CookieOptions {
  httpOnly?: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  domain?: string;
  path: string;
  maxAge?: number;
}

/**
 * Get cookie options for authentication tokens
 * Works with both HTTP and HTTPS
 */
export const getCookieOptions = (): CookieOptions => {
  const isProduction = env.nodeEnv === "production";
  const useHttps = env.useHttps || isProduction;

  return {
    httpOnly: process.env.COOKIE_HTTP_ONLY !== "false", // Default to true
    secure: isProduction ? true : useHttps, // Only secure in production or if forced
    sameSite: isProduction ? "none" : "lax", // Lax is better for localhost dev
    ...(env.cookieDomain && { domain: env.cookieDomain }),
    path: "/",
  };
};

/**
 * Get cookie options for access token (7 days)
 */
export const getAccessTokenCookieOptions = (): CookieOptions => {
  return {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};


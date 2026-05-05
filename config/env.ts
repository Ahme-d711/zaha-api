import "dotenv/config";

/** Comma-separated origins, e.g. `https://app.vercel.app,https://preview.vercel.app` */
function parseAllowedFrontendOrigins(): string[] {
  const raw = process.env.FRONTEND_URL?.trim();
  if (raw) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if ((process.env.NODE_ENV || "development") === "production") {
    return [];
  }
  return ["http://localhost:8080", "http://localhost:3030", "http://localhost:5173"];
}

const allowedFrontendOrigins = parseAllowedFrontendOrigins();

export const env = {
  port: Number(process.env.PORT) || 3131,
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/silver-glow",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "",
  googleApiKey: process.env.GOOGLE_API_KEY || "AIzaSyA-_aCHOdvzoO2YDMNeqoRhX-onbv2hRVM",
  /** Origins allowed by CORS (from FRONTEND_URL, comma-separated). */
  allowedFrontendOrigins,
  /** First allowed origin (e.g. redirects / emails); prefer setting FRONTEND_URL. */
  frontendUrl:
    allowedFrontendOrigins[0] ??
    process.env.FRONTEND_URL?.split(",")[0]?.trim() ??
    "http://localhost:8080",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  defaultAdminEmail: process.env.DEFAULT_ADMIN_EMAIL || "admin@admin.com",
  defaultAdminPassword: process.env.DEFAULT_ADMIN_PASSWORD || "admin123",
  defaultAdminPhone: process.env.DEFAULT_ADMIN_PHONE || "201018939831",
  defaultAdminAddress: process.env.DEFAULT_ADMIN_ADDRESS || "123 Main St, Anytown, USA",
  defaultAdminName: process.env.DEFAULT_ADMIN_NAME || "Super Admin",
  useHttps: process.env.USE_HTTPS === "true",
  cookieHttpOnly: process.env.COOKIE_HTTP_ONLY === "true",
  resendApiKey: process.env.RESEND_API_KEY || "re_No9QyGNq_NrSoTXi9ikKj5uhWc8bp1eyZ",
  adminEmail: process.env.ADMIN_EMAIL || "elgedawyahmed333@gmail.com",
};



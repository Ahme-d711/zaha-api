import "dotenv/config";

export const env = {
  port: Number(process.env.PORT) || 3131,
  mongodbUri: process.env.MONGODB_URI || "mongodb://localhost:27017/silver-glow",
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "",
  googleApiKey: process.env.GOOGLE_API_KEY || "AIzaSyA-_aCHOdvzoO2YDMNeqoRhX-onbv2hRVM",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
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



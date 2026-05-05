import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/notfound.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.config.js";
import { router as apiRouter } from "./routes/index.js";
import { ensureServerReady } from "./bootstrap.js";
import type { CorsOptions } from "cors";

const app: Application = express();

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (env.allowedFrontendOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(async (req, res, next) => {
  try {
    await ensureServerReady();
    next();
  } catch (err) {
    next(err);
  }
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

app.use("/api", apiLimiter);

app.use(
  session({
    secret: env.jwtSecret,
    resave: false,
    saveUninitialized: false,
    store:
      env.nodeEnv === "production"
        ? MongoStore.create({
            mongoUrl: env.mongodbUri,
            touchAfter: 24 * 3600,
          })
        : undefined,
    cookie: {
      secure: env.nodeEnv === "production",
      httpOnly: true,
      sameSite: env.nodeEnv === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      ...(env.cookieDomain && { domain: env.cookieDomain }),
    },
  })
);

const uploadsPath =
  env.nodeEnv === "production"
    ? process.env.VERCEL
      ? path.join(process.cwd(), "public", "uploads")
      : path.resolve("/var/www/projects/silver-glow/server/uploads")
    : path.join(process.cwd(), "uploads");

app.use("/uploads", express.static(uploadsPath));

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      docExpansion: "none",
      persistAuthorization: true,
    },
    customSiteTitle: "Silver Glow API Docs",
  })
);

app.use("/api", apiRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

app.use(globalErrorHandler);
app.use(notFoundHandler);

export default app;

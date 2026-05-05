import express, { type Application } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "path";
import swaggerUi from 'swagger-ui-express';
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import { notFoundHandler } from "./middlewares/notfound.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { initDefaultAdmin } from "./utils/initDefaultAdmin.js";
import { swaggerSpec } from "./config/swagger.config.js";
import { router as apiRouter } from "./routes/index.js";

const PORT = env.port;

const app: Application = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.frontendUrl || "http://localhost:3030",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

app.use(
  session({
    secret: env.jwtSecret,
    resave: false,
    saveUninitialized: false,
    store: env.nodeEnv === "production"
      ? MongoStore.create({
        mongoUrl: env.mongodbUri,
        touchAfter: 24 * 3600 // lazy session update
      })
      : undefined,
    cookie: {
      secure: env.nodeEnv === "production",
      httpOnly: true,
      sameSite: env.nodeEnv === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      ...(env.cookieDomain && { domain: env.cookieDomain }),
    },
  })
);

const uploadsPath = env.nodeEnv === "production"
  ? path.resolve("/var/www/projects/silver-glow/server/uploads")
  : path.join(process.cwd(), "uploads");

app.use("/uploads", express.static(uploadsPath));

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    docExpansion: 'none', // Correctly collapse all sections by default
    persistAuthorization: true,
  },
  customSiteTitle: "Silver Glow API Docs",
}));

app.use("/api", apiRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  });
});

app.use(globalErrorHandler);
app.use(notFoundHandler);

async function start() {
  try {
    await connectDatabase();
    console.log("MongoDB connected");

    // Initialize default admin user if no users exist
    await initDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

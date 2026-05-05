import multer from "multer";
import path from "path";
import fs from "fs";
import { env } from "../config/env.js";
import AppError from "../errors/AppError.js";

// --------------------------------------------
// Constant: Upload path outside dist
// --------------------------------------------
const ROOT_UPLOADS = env.nodeEnv === "production" 
  ? "/var/www/projects/silver-glow/server/uploads"
  : path.join(process.cwd(), "uploads");

// Ensure folder exists
const ensureUploadsDir = (subfolder: string) => {
  const dir = path.join(ROOT_UPLOADS, subfolder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// --------------------------------------------
// Validators
// --------------------------------------------
const imageFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("File type not supported. Use JPEG, PNG, or WebP", 400));
  }
};

// --------------------------------------------
// Storage Factory
// --------------------------------------------
const createStorage = (folder: string, prefix: string) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = ensureUploadsDir(folder);
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${prefix}-${unique}${ext}`);
    },
  });

// --------------------------------------------
// Uploaders
// --------------------------------------------
export const uploadBanner = multer({
  storage: createStorage("banners", "banner"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadUser = multer({
  storage: createStorage("users", "user"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadCategory = multer({
  storage: createStorage("categories", "category"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadSubcategory = multer({
  storage: createStorage("subcategories", "subcategory"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadSection = multer({
  storage: createStorage("sections", "section"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadProduct = multer({
  storage: createStorage("products", "product"),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadAd = multer({
  storage: createStorage("ads", "ad"),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadImage = multer({
  storage: createStorage("images", "image"),
  fileFilter: imageFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    fieldNameSize: 100, // Maximum field name size
    fields: 200, // Maximum number of non-file fields (increased for many images + description)
    files: 100, // Maximum number of files (50 internal + 50 external)
  },
});

// --------------------------------------------
// Delete File
// --------------------------------------------
export const deleteFile = async (relativePath: string): Promise<void> => {
  const clean = relativePath.replace(/^\//, "");
  const fullPath = path.join(ROOT_UPLOADS, clean);

  return new Promise((resolve, reject) => {
    fs.unlink(fullPath, err => {
      if (err && err.code !== "ENOENT") reject(err);
      else resolve();
    });
  });
};

// --------------------------------------------
// Absolute → Relative (for DB)
// --------------------------------------------
export const getRelativePath = (absolutePath: string): string => {
  const relative = absolutePath.replace(ROOT_UPLOADS + "/", "").replace(/\\/g, "/");
  return `/uploads/${relative}`;
};

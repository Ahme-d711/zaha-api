import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { UserModel } from "../models/user.model.js";
import { CategoryModel } from "../models/category.model.js";
import { ProductModel } from "../models/product.model.js";
import { ReviewModel } from "../models/review.model.js";
import { SettingsModel } from "../models/settings.model.js";
import { WishlistModel } from "../models/wishlist.model.js";
import { CartModel } from "../models/cart.model.js";
import { OrderModel } from "../models/order.model.js";
import { TransactionModel } from "../models/transaction.model.js";

const RESET_MODE = process.argv.includes("--reset");
const SKIP_IMAGE_DOWNLOAD = process.argv.includes("--skip-image-download");

const usersSeed = [
  {
    name: "Super Admin",
    email: "superadmin@zaha.com",
    phone: "201111111111",
    role: "super_admin" as const,
    gender: "male" as const,
    address: "Cairo, Egypt",
    totalBalance: 20000,
  },
  {
    name: "Admin User",
    email: "admin@zaha.com",
    phone: "201122222222",
    role: "admin" as const,
    gender: "male" as const,
    address: "Giza, Egypt",
    totalBalance: 5000,
  },
  {
    name: "Vendor One",
    email: "vendor@zaha.com",
    phone: "201133333333",
    role: "vendor" as const,
    gender: "female" as const,
    address: "Alexandria, Egypt",
    totalBalance: 3000,
  },
  {
    name: "Customer Sara",
    email: "sara@zaha.com",
    phone: "201144444444",
    role: "user" as const,
    gender: "female" as const,
    address: "Mansoura, Egypt",
    totalBalance: 1200,
  },
  {
    name: "Customer Omar",
    email: "omar@zaha.com",
    phone: "201155555555",
    role: "user" as const,
    gender: "male" as const,
    address: "Tanta, Egypt",
    totalBalance: 900,
  },
];

const categoriesSeed = [
  { name: "Headphones", description: "Wireless and wired audio products", priority: 90 },
  { name: "Speakers", description: "Portable and home speaker systems", priority: 80 },
  { name: "Smart Watches", description: "Fitness and lifestyle smart watches", priority: 70 },
  { name: "Gaming", description: "Gaming accessories and devices", priority: 60 },
  { name: "Accessories", description: "Daily-use mobile and tech accessories", priority: 50 },
];

const productTemplates = [
  {
    id: "prod_001",
    name: "Wireless Noise-Cancelling Headphones",
    category: "Headphones",
    description:
      "Premium wireless headphones with adaptive noise cancellation, plush ear cushions, and up to 30 hours of playback for travel and focused work.",
    price: 349,
    old_price: 449,
    discount_percentage: 22,
    stock: 120,
    is_best_seller: true,
    battery_life: "30h",
    noise_cancelling: true,
    audio: ["Adaptive EQ", "Spatial Audio"],
    free_shipping: true,
    shipping_condition: "Orders over $50",
    warranty: "2 years",
    returns: "30 days",
  },
  {
    id: "prod_002",
    name: "Studio Monitoring Headphones",
    category: "Headphones",
    description:
      "Studio-oriented closed-back headphones tuned for flat, accurate monitoring—ideal for mixing, mastering, and critical listening sessions.",
    price: 219,
    old_price: 279,
    discount_percentage: 21,
    stock: 80,
    is_best_seller: false,
    battery_life: "N/A",
    noise_cancelling: false,
    audio: ["High Fidelity", "Low Latency"],
    free_shipping: true,
    shipping_condition: "Orders over $100",
    warranty: "1 year",
    returns: "14 days",
  },
  {
    id: "prod_003",
    name: "Portable Bluetooth Speaker",
    category: "Speakers",
    description:
      "Compact Bluetooth speaker with deep bass and stereo imaging. IP-rated durability and long battery life for parties and outdoor use.",
    price: 159,
    old_price: 199,
    discount_percentage: 20,
    stock: 150,
    is_best_seller: true,
    battery_life: "18h",
    noise_cancelling: false,
    audio: ["Deep Bass", "Stereo"],
    free_shipping: true,
    shipping_condition: "Orders over $40",
    warranty: "1 year",
    returns: "30 days",
  },
  {
    id: "prod_004",
    name: "Premium Home Speaker",
    category: "Speakers",
    description:
      "Room-filling home speaker with rich lows and clear highs. Designed for movies, music, and smart-home voice control in larger spaces.",
    price: 499,
    old_price: 599,
    discount_percentage: 17,
    stock: 40,
    is_best_seller: false,
    battery_life: "AC Powered",
    noise_cancelling: false,
    audio: ["Dolby", "Room Fill"],
    free_shipping: true,
    shipping_condition: "Always free",
    warranty: "3 years",
    returns: "30 days",
  },
  {
    id: "prod_005",
    name: "Smart Watch Pro",
    category: "Smart Watches",
    description:
      "Advanced health and fitness tracking with AMOLED display, GPS, and multi-day battery. Swim-ready build with comprehensive workout modes.",
    price: 299,
    old_price: 369,
    discount_percentage: 19,
    stock: 95,
    is_best_seller: true,
    battery_life: "7d",
    noise_cancelling: false,
    audio: ["Voice Assistant"],
    free_shipping: true,
    shipping_condition: "Orders over $60",
    warranty: "2 years",
    returns: "30 days",
  },
  {
    id: "prod_006",
    name: "Smart Watch Lite",
    category: "Smart Watches",
    description:
      "Lightweight smartwatch focused on daily activity, sleep insights, and notifications—with exceptional battery life for all-week wear.",
    price: 179,
    old_price: 229,
    discount_percentage: 22,
    stock: 130,
    is_best_seller: false,
    battery_life: "10d",
    noise_cancelling: false,
    audio: ["Fitness Alerts"],
    free_shipping: false,
    shipping_condition: "Standard shipping",
    warranty: "1 year",
    returns: "14 days",
  },
  {
    id: "prod_007",
    name: "Gaming Mechanical Keyboard",
    category: "Gaming",
    description:
      "Mechanical gaming keyboard with tactile switches, per-key RGB, and durable construction for competitive play and long typing sessions.",
    price: 139,
    old_price: 179,
    discount_percentage: 22,
    stock: 75,
    is_best_seller: true,
    battery_life: "N/A",
    noise_cancelling: false,
    audio: ["RGB Profiles"],
    free_shipping: true,
    shipping_condition: "Orders over $50",
    warranty: "1 year",
    returns: "30 days",
  },
  {
    id: "prod_008",
    name: "Gaming Mouse Ultra",
    category: "Gaming",
    description:
      "Ergonomic wireless gaming mouse with precise sensor, low-latency connectivity, and long battery life—tuned for FPS and MOBA sessions.",
    price: 89,
    old_price: 119,
    discount_percentage: 25,
    stock: 160,
    is_best_seller: true,
    battery_life: "70h",
    noise_cancelling: false,
    audio: ["Low Latency Wireless"],
    free_shipping: true,
    shipping_condition: "Orders over $50",
    warranty: "1 year",
    returns: "30 days",
  },
  {
    id: "prod_009",
    name: "USB-C Fast Charger",
    category: "Accessories",
    description:
      "Compact USB-C fast charger with power delivery for phones, tablets, and laptops. Foldable prongs and smart temperature protection.",
    price: 39,
    old_price: 49,
    discount_percentage: 20,
    stock: 300,
    is_best_seller: false,
    battery_life: "N/A",
    noise_cancelling: false,
    audio: ["Power Delivery"],
    free_shipping: false,
    shipping_condition: "Standard shipping",
    warranty: "6 months",
    returns: "14 days",
  },
  {
    id: "prod_010",
    name: "Premium Phone Case",
    category: "Accessories",
    description:
      "Slim protective case with shock-absorbing corners and raised edges. Wireless charging compatible with a comfortable, grippy finish.",
    price: 29,
    old_price: 39,
    discount_percentage: 26,
    stock: 250,
    is_best_seller: false,
    battery_life: "N/A",
    noise_cancelling: false,
    audio: ["Shock Proof"],
    free_shipping: false,
    shipping_condition: "Standard shipping",
    warranty: "6 months",
    returns: "14 days",
  },
];

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Local path under /uploads/products (JPEGs from seed downloads). */
function productImagePath(name: string) {
  const slug = toSlug(name);
  return `/uploads/products/${slug}.jpg`;
}

const GALLERY_SLOT_COUNT = 4;

/** Distinct on-disk paths for gallery (never reuse main). */
function productGalleryImagePath(name: string, slot: number) {
  const slug = toSlug(name);
  return `/uploads/products/${slug}-g${slot}.jpg`;
}

/**
 * Tag-based demo images (loremflickr) — each product gets a different, stable photo via `lock`.
 * See https://loremflickr.com — suitable for local/dev demos only.
 */
const SEED_PRODUCT_IMAGE_TAGS: Record<string, string> = {
  prod_001: "headphones,wireless",
  prod_002: "headphones,studio",
  prod_003: "bluetooth,speaker",
  prod_004: "speaker,sound",
  prod_005: "smartwatch",
  prod_006: "watch,fitness",
  prod_007: "keyboard,gaming",
  prod_008: "mouse,gaming",
  prod_009: "charger,cable",
  prod_010: "smartphone,case",
};

function buildSeedProductImageUrl(productId: string) {
  const tags = SEED_PRODUCT_IMAGE_TAGS[productId];
  if (!tags) return null;
  const safeTags = tags.replace(/\s+/g, "");
  return `https://loremflickr.com/900/900/${safeTags}?lock=${encodeURIComponent(productId)}`;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVER_ROOT = path.resolve(__dirname, "..");
const UPLOADS_PRODUCTS = path.join(SERVER_ROOT, "uploads/products");

function resolveUploadsPath(webPath: string) {
  const rel = webPath.replace(/^\//, "");
  return path.join(SERVER_ROOT, rel);
}

async function downloadToFile(sourceUrl: string, destAbsolute: string) {
  const res = await fetch(sourceUrl, {
    redirect: "follow",
    headers: {
      Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      "User-Agent": "ZahaSeed/1.0 (+https://github.com)",
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} while fetching ${sourceUrl}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(destAbsolute), { recursive: true });
  fs.writeFileSync(destAbsolute, buf);
  // Remove old same-slug PNG from earlier seeds (was copied from a single placeholder).
  if (destAbsolute.endsWith(".jpg")) {
    const legacyPng = destAbsolute.replace(/\.jpg$/i, ".png");
    if (fs.existsSync(legacyPng)) {
      try {
        fs.unlinkSync(legacyPng);
      } catch {
        // ignore
      }
    }
  }
}

/** Deterministic generic image per product if remote URL fails (no local user photos). */
async function downloadFallbackProductImage(productId: string, destAbsolute: string) {
  const url = `https://picsum.photos/seed/zaha-${productId}/900/900`;
  await downloadToFile(url, destAbsolute);
}

/**
 * Writes the on-disk file for a product main image and returns the web path stored in Mongo.
 */
async function ensureProductSeedImage(productId: string, webPath: string) {
  const dest = resolveUploadsPath(webPath);
  if (SKIP_IMAGE_DOWNLOAD) {
    console.warn(`  skip-image-download: leaving ${webPath} unchanged`);
    return;
  }
  const primaryUrl = buildSeedProductImageUrl(productId);
  try {
    if (primaryUrl) {
      await downloadToFile(primaryUrl, dest);
    } else {
      await downloadFallbackProductImage(productId, dest);
    }
  } catch (primaryError) {
    console.warn(`  Primary image failed for ${productId}, using deterministic fallback.`, primaryError);
    try {
      await downloadFallbackProductImage(productId, dest);
    } catch (fallbackError) {
      console.error(`  Could not download any image for ${productId}`, fallbackError);
      throw fallbackError;
    }
  }
}

/** Lorem Flickr (theme-consistent) — used if picsum /id/ fails */
function buildSeedProductGalleryImageUrl(productId: string, slot: number) {
  const tags = SEED_PRODUCT_IMAGE_TAGS[productId];
  if (!tags) return null;
  const varied = `${tags},angle${slot},studio${slot}`;
  const safeTags = varied.replace(/\s+/g, "");
  const lock = `${productId}-gallery-${slot}`;
  return `https://loremflickr.com/900/900/${safeTags}?lock=${encodeURIComponent(lock)}`;
}

/** Stable unique picsum seeds per product + slot (no /id/ 404s; hashes never collide across g1–g4). */
function galleryPicsumSeedUrl(productId: string, slot: number): string {
  const h = crypto.createHash("sha256").update(`${productId}|g|${slot}`).digest("hex").slice(0, 24);
  return `https://picsum.photos/seed/${h}/900/900`;
}

async function ensureProductGallerySeedImage(productId: string, slot: number, webPath: string) {
  const dest = resolveUploadsPath(webPath);
  if (SKIP_IMAGE_DOWNLOAD) {
    console.warn(`  skip-image-download: leaving ${webPath} unchanged`);
    return;
  }
  const picsumUrl = galleryPicsumSeedUrl(productId, slot);
  try {
    await downloadToFile(picsumUrl, dest);
  } catch (e) {
    console.warn(`  Gallery slot ${slot} for ${productId}: picsum failed, trying lorem.`, e);
    const lorem = buildSeedProductGalleryImageUrl(productId, slot);
    if (lorem) {
      await downloadToFile(lorem, dest);
    } else {
      await downloadFallbackProductImage(`${productId}-g${slot}`, dest);
    }
  }
}

/** Lorem Flickr tags by category slug — demo imagery only */
const SEED_CATEGORY_IMAGE_TAGS: Record<string, string> = {
  headphones: "headphones,audio",
  speakers: "speaker,sound",
  "smart-watches": "smartwatch,watch",
  gaming: "gaming,keyboard",
  accessories: "gadgets,mobile",
};

function buildSeedCategoryImageUrl(slug: string) {
  const tags = SEED_CATEGORY_IMAGE_TAGS[slug] ?? "electronics,store";
  const safeTags = tags.replace(/\s+/g, "");
  return `https://loremflickr.com/640/640/${safeTags}?lock=${encodeURIComponent(`cat-${slug}`)}`;
}

async function ensureCategorySeedImage(slug: string, webPath: string) {
  const dest = resolveUploadsPath(webPath);
  if (SKIP_IMAGE_DOWNLOAD) {
    console.warn(`  skip-image-download: leaving ${webPath} unchanged`);
    return;
  }
  try {
    await downloadToFile(buildSeedCategoryImageUrl(slug), dest);
  } catch (primaryError) {
    console.warn(`  Category image primary failed for ${slug}, using fallback.`, primaryError);
    const url = `https://picsum.photos/seed/zaha-cat-${slug}/640/640`;
    await downloadToFile(url, dest);
  }
}

async function seed() {
  await connectDatabase();
  console.log(`Connected to DB. Reset mode: ${RESET_MODE ? "ON" : "OFF"}`);

  if (RESET_MODE) {
    await Promise.all([
      OrderModel.deleteMany({}),
      TransactionModel.deleteMany({}),
      ReviewModel.deleteMany({}),
      CartModel.deleteMany({}),
      WishlistModel.deleteMany({}),
      ProductModel.deleteMany({}),
      CategoryModel.deleteMany({}),
      SettingsModel.deleteMany({}),
      UserModel.deleteMany({}),
    ]);
    console.log("Existing data cleared.");
  }

  const defaultPassword = await bcrypt.hash("12345678", 10);

  const usersByEmail = new Map<string, any>();
  for (const userData of usersSeed) {
    const user = await UserModel.findOneAndUpdate(
      { email: userData.email },
      {
        ...userData,
        password: defaultPassword,
        isVerified: true,
        isActive: true,
        isBlocked: false,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    usersByEmail.set(userData.email, user);
  }
  console.log(`Users seeded: ${usersByEmail.size}`);

  const categoriesByName = new Map<string, any>();
  for (const cat of categoriesSeed) {
    const slug = toSlug(cat.name);
    const imageWeb = `/uploads/categories/${slug}.jpg`;
    await ensureCategorySeedImage(slug, imageWeb);
    const category = await CategoryModel.findOneAndUpdate(
      { name: cat.name },
      { ...cat, slug, image: imageWeb, isShow: true, isDeleted: false },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    categoriesByName.set(cat.name, category);
  }
  console.log(`Categories seeded: ${categoriesByName.size}`);

  const addedBy = usersByEmail.get("admin@zaha.com")?._id || usersByEmail.get("superadmin@zaha.com")?._id;
  const products: any[] = [];
  for (const p of productTemplates) {
    const category = categoriesByName.get(p.category);
    const main = productImagePath(p.name);
    await ensureProductSeedImage(p.id, main);

    const gallery: string[] = [];
    for (let slot = 1; slot <= GALLERY_SLOT_COUNT; slot++) {
      const gPath = productGalleryImagePath(p.name, slot);
      await ensureProductGallerySeedImage(p.id, slot, gPath);
      gallery.push(gPath);
    }

    const product = await ProductModel.findOneAndUpdate(
      { id: p.id },
      {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        old_price: p.old_price,
        discount_percentage: p.discount_percentage,
        rating: 0,
        reviews_count: 0,
        images: {
          main,
          gallery,
        },
        stock: p.stock,
        is_best_seller: p.is_best_seller,
        features: {
          battery_life: p.battery_life,
          noise_cancelling: p.noise_cancelling,
          audio: p.audio,
        },
        shipping: {
          free_shipping: p.free_shipping,
          condition: p.shipping_condition,
        },
        warranty: p.warranty,
        returns: p.returns,
        categoryId: category?._id,
        addedBy,
        slug: toSlug(p.name),
        isDeleted: false,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    products.push(product);
  }
  console.log(`Products seeded: ${products.length}`);

  await SettingsModel.findOneAndUpdate(
    {},
    {
      shippingCost: 50,
      taxRate: 14,
      freeShippingThreshold: 500,
      currency: "EGP",
      contactEmail: "support@zaha.com",
      contactPhone: "+20 101 111 1111",
      socialLinks: {
        facebook: "https://facebook.com/zaha",
        instagram: "https://instagram.com/zaha",
        twitter: "https://x.com/zaha",
        whatsapp: "https://wa.me/201011111111",
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  console.log("Settings seeded.");

  const sara = usersByEmail.get("sara@zaha.com");
  const omar = usersByEmail.get("omar@zaha.com");
  const customerUsers = [sara, omar].filter(Boolean);

  for (const customer of customerUsers) {
    const pickedProducts = products.slice(0, 4);
    await WishlistModel.findOneAndUpdate(
      { userId: customer._id },
      { userId: customer._id, products: pickedProducts.map((p) => p._id) },
      { upsert: true, new: true }
    );
    await CartModel.findOneAndUpdate(
      { userId: customer._id },
      {
        userId: customer._id,
        items: [
          { productId: pickedProducts[0]?._id, quantity: 1 },
          { productId: pickedProducts[1]?._id, quantity: 2 },
        ],
      },
      { upsert: true, new: true }
    );
  }
  console.log("Carts and wishlists seeded.");

  const reviewSeed = [
    { user: sara, product: products[0], rating: 5, comment: "Excellent sound quality and battery." },
    { user: omar, product: products[0], rating: 4, comment: "Very good, noise cancelling is strong." },
    { user: sara, product: products[2], rating: 4, comment: "Portable and loud enough for outdoors." },
    { user: omar, product: products[4], rating: 5, comment: "Great watch and smooth experience." },
  ];

  for (const r of reviewSeed) {
    if (!r.user || !r.product) continue;
    await ReviewModel.findOneAndUpdate(
      { userId: r.user._id, productId: r.product._id },
      {
        userId: r.user._id,
        productId: r.product._id,
        rating: r.rating,
        comment: r.comment,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log("Reviews seeded.");

  const orderSeed = [
    { customer: sara, trackingNumber: "ORD-1001", status: "DELIVERED", paymentMethod: "CARD", paymentStatus: "PAID" },
    { customer: sara, trackingNumber: "ORD-1002", status: "PENDING", paymentMethod: "COD", paymentStatus: "PENDING" },
    { customer: omar, trackingNumber: "ORD-1003", status: "SHIPPED", paymentMethod: "WALLET", paymentStatus: "PAID" },
  ];

  for (const entry of orderSeed) {
    if (!entry.customer) continue;
    const items = [
      {
        productId: products[0]._id,
        name: products[0].name,
        price: products[0].price,
        quantity: 1,
        image: products[0].images?.main,
      },
      {
        productId: products[2]._id,
        name: products[2].name,
        price: products[2].price,
        quantity: 2,
        image: products[2].images?.main,
      },
    ];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingCost = subtotal >= 500 ? 0 : 50;
    const taxRate = 14;
    const taxAmount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
    const totalAmount = subtotal + shippingCost + taxAmount;

    await OrderModel.findOneAndUpdate(
      { trackingNumber: entry.trackingNumber },
      {
        userId: entry.customer._id,
        items,
        recipientName: entry.customer.name,
        recipientPhone: entry.customer.phone,
        shippingAddress: entry.customer.address || "Default Address",
        city: "Cairo",
        governorate: "Cairo",
        country: "Egypt",
        postalCode: "12345",
        subtotal,
        shippingCost,
        taxRate,
        taxAmount,
        totalAmount,
        paymentMethod: entry.paymentMethod,
        paymentStatus: entry.paymentStatus,
        trackingNumber: entry.trackingNumber,
        status: entry.status,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log("Orders seeded.");

  console.log("Seed completed successfully.");
  console.log("Default login password for seeded users: 12345678");
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });


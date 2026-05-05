import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryStatus,
  getCategoryBySlug,
  restoreCategory,
} from "../controllers/category.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { uploadCategory } from "../utils/upload.js";

export const router = Router();

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */
router.get("/", getAllCategories);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 */
router.get("/:id", getCategoryById);

/**
 * @swagger
 * /categories/slug/{slug}:
 *   get:
 *     summary: Get category by slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 */
router.get("/slug/:slug", getCategoryBySlug);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Create category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Category created
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin"),
  uploadCategory.single("image"),
  createCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Update category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put(
  "/:id",
  authenticate,
  authorize("admin", "super_admin"),
  uploadCategory.single("image"),
  updateCategory
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Delete category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete("/:id", authenticate, authorize("admin", "super_admin"), deleteCategory);

/**
 * @swagger
 * /categories/{id}/restore:
 *   patch:
 *     summary: Restore category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category restored
 */
router.patch(
  "/:id/restore",
  authenticate,
  authorize("admin", "super_admin"),
  restoreCategory
);

/**
 * @swagger
 * /categories/{id}/toggle-status:
 *   patch:
 *     summary: Toggle category status (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  "/:id/toggle-status",
  authenticate,
  authorize("admin", "super_admin"),
  toggleCategoryStatus
);

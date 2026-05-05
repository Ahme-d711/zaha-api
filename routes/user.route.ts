import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  updateUserBlockStatus,
  updateUserBalance,
  activateUser,
} from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { uploadUser } from "../utils/upload.js";

export const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User account management (Admin only)
 */

// All user routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Get current logged in user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 */
router.get("/me", getCurrentUser);

// Admin only routes
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               role: { type: string, enum: [user, admin] }
 *               picture: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: User created
 */
router.get("/", authorize("admin", "super_admin"), getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user details (Admin only)
 *     tags: [Users]
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
 *         description: User details
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Users]
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
 *         description: User updated
 *   delete:
 *     summary: Soft delete user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted
 */
router.get("/:id", authorize("admin", "super_admin"), getUserById);
router.post("/", authorize("admin", "super_admin"), uploadUser.single("picture"), createUser);

/**
 * @swagger
 * /users/{id}/block:
 *   patch:
 *     summary: Toggle user block status (Admin only)
 *     tags: [Users]
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
 *         description: Block status updated
 */
router.patch("/:id/block", authorize("admin", "super_admin"), updateUserBlockStatus);

/**
 * @swagger
 * /users/{id}/balance:
 *   patch:
 *     summary: Update user wallet balance (Admin only)
 *     tags: [Users]
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               balance: { type: number }
 *     responses:
 *       200:
 *         description: Balance updated
 */
router.patch("/:id/balance", authorize("admin", "super_admin"), updateUserBalance);

/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Reactivate soft-deleted user (Admin only)
 *     tags: [Users]
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
 *         description: User activated
 */
router.patch("/:id/activate", authorize("admin", "super_admin"), activateUser);

router.put("/:id", authorize("admin", "super_admin"), uploadUser.single("picture"), updateUser);
router.delete("/:id", authorize("admin", "super_admin"), deleteUser);

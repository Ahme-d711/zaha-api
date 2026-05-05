import { Router } from "express";
import {
  getWishlist,
  toggleWishlistItem,
  clearWishlist,
} from "../controllers/wishlist.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wishlist
 *   description: Personal wishlist management
 */

// All wishlist routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /wishlist:
 *   get:
 *     summary: Get user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist details
 */
router.get("/", getWishlist);

/**
 * @swagger
 * /wishlist/toggle:
 *   post:
 *     summary: Add or remove product from wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId: { type: string }
 *     responses:
 *       200:
 *         description: Wishlist updated
 */
router.post("/toggle", toggleWishlistItem);

/**
 * @swagger
 * /wishlist/clear:
 *   delete:
 *     summary: Clear user's wishlist
 *     tags: [Wishlist]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist cleared
 */
router.delete("/clear", clearWishlist);

export default router;

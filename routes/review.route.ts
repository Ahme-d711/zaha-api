import { Router } from "express";
import {
  getProductReviews,
  getTopReviews,
  addReview,
  updateReview,
  deleteReview,
} from "../controllers/review.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product review and rating management
 */

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Get all reviews for a specific product
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get("/product/:productId", getProductReviews);

/**
 * @swagger
 * /reviews/top:
 *   get:
 *     summary: Get top 5-star reviews for homepage
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: List of top reviews
 */
router.get("/top", getTopReviews);

// Protected routes
router.use(authenticate);

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Submit a new review for a product
 *     tags: [Reviews]
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
 *               - rating
 *             properties:
 *               productId: { type: string }
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Review submitted successfully
 */
router.post("/", addReview);

/**
 * @swagger
 * /reviews/{id}:
 *   patch:
 *     summary: Update an existing review
 *     tags: [Reviews]
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
 *               rating: { type: number, minimum: 1, maximum: 5 }
 *               comment: { type: string }
 *     responses:
 *       200:
 *         description: Review updated
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
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
 *         description: Review deleted
 */
router.patch("/:id", updateReview);
router.delete("/:id", deleteReview);

export default router;

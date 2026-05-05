import { Router } from "express";
import { getDashboardStats, getRevenueAnalytics } from "../controllers/dashboard.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Administrative dashboard statistics (Admin only)
 */

// All dashboard routes are protected and restricted to admin
router.use(authenticate);
router.use(authorize("admin"));

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get high-level dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics data
 */
router.get("/stats", getDashboardStats);

/**
 * @swagger
 * /dashboard/revenue-analytics:
 *   get:
 *     summary: Get revenue analytics data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [Week, Month, Year]
 *     responses:
 *       200:
 *         description: Revenue analytics data
 */
router.get("/revenue-analytics", getRevenueAnalytics);

export default router;

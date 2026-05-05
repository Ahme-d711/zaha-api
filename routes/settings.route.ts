import express from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: Global system settings
 */

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get global settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Global settings details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 */
router.get("/", getSettings);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Update global settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Settings'
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Settings'
 */
router.put("/", authenticate, authorize("admin"), updateSettings);

export default router;

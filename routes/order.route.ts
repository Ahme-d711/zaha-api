import { Router } from "express";
import { 
  getAllOrders, 
  getOrderById, 
  createOrder, 
  updateOrder,
  cancelOrder,
  updateOrderStatus,
  checkout,
  getMyOrders
} from "../controllers/order.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management and checkout
 */

// Protect all routes
router.use(authenticate);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *   post:
 *     summary: Create a manual order (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created
 */
router.route("/")
  .get(asyncHandler(getAllOrders))
  .post(asyncHandler(createOrder));

/**
 * @swagger
 * /orders/my-orders:
 *   get:
 *     summary: Get regular user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's orders
 */
router.get("/my-orders", asyncHandler(getMyOrders));

/**
 * @swagger
 * /orders/checkout:
 *   post:
 *     summary: Process order checkout for regular user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Checkout successful
 */
router.post("/checkout", asyncHandler(checkout));

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details
 *     tags: [Orders]
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
 *         description: Order details
 *   patch:
 *     summary: Update order info (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order updated
 */
router.route("/:id")
  .get(asyncHandler(getOrderById))
  .patch(asyncHandler(updateOrder));

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", asyncHandler(updateOrderStatus));

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order cancelled
 */
router.patch("/:id/cancel", asyncHandler(cancelOrder));

export { router as orderRouter };

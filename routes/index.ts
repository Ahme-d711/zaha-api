import { Router } from "express";
import { router as authRoutes } from "./auth.route.js";
import { router as userRoutes } from "./user.route.js";
import { router as categoryRoutes } from "./category.route.js";
import { router as productRoutes } from "./product.route.js";
import { orderRouter as orderRoutes } from "./order.route.js";
import dashboardRoutes from "./dashboard.route.js";
import cartRouter from "./cart.route.js";
import wishlistRouter from "./wishlist.route.js";
import reviewRouter from "./review.route.js";

import settingsRoutes from "./settings.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/settings", settingsRoutes);
router.use("/cart", cartRouter);
router.use("/wishlist", wishlistRouter);
router.use("/reviews", reviewRouter);

export { router };

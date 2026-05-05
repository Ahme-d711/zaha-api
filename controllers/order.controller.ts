import { Request, Response } from "express";
import { OrderModel } from "../models/order.model.js";
import { UserModel } from "../models/user.model.js";
import { createOrderSchema, updateOrderSchema, queryOrderSchema, updateOrderStatusSchema } from "../schemas/order.schema.js";
import { checkoutSchema } from "../schemas/checkout.schema.js";
import { CartModel } from "../models/cart.model.js";
import { ProductModel } from "../models/product.model.js";
import { TransactionModel } from "../models/transaction.model.js";
import { SettingsModel } from "../models/settings.model.js";
import AppError from "../errors/AppError.js";
import { IProduct } from "../types/product.type.js";

/**
 * Get all orders with filtering and pagination
 */
export const getAllOrders = async (req: Request, res: Response) => {
  const validatedQuery = queryOrderSchema.parse(req.query);
  const { status, group, paymentStatus, userId, search, page, limit, startDate, endDate } = validatedQuery;

  const query: Record<string, any> = {};

  if (group === "processing") {
    query.status = { $in: ["PENDING", "CONFIRMED", "PROCESSING"] };
  } else if (status) {
    query.status = status;
  }
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (userId) query.userId = userId;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) (query.createdAt as any).$gte = new Date(startDate);
    if (endDate) (query.createdAt as any).$lte = new Date(endDate);
  }

  if (search) {
    query.$or = [
      { trackingNumber: { $regex: search, $options: "i" } },
      { recipientName: { $regex: search, $options: "i" } },
      { recipientPhone: { $regex: search, $options: "i" } },
      {
        $expr: {
          $regexMatch: {
            input: { $toString: "$_id" },
            regex: search,
            options: "i"
          }
        }
      }
    ];
  }

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    OrderModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name phone email")
      .populate("items.productId", "nameAr nameEn mainImage"),
    OrderModel.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Orders fetched successfully",
    data: {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

/**
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const order = await OrderModel.findById(id)
    .populate("userId", "name phone email")
    .populate("items.productId", "nameAr nameEn mainImage");

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Order fetched successfully",
    data: { order },
  });
};

/**
 * Create new order
 */
export const createOrder = async (req: Request, res: Response) => {
  const validatedBody = createOrderSchema.parse(req.body);
  
  let userId = req.user?._id;
  
  // Allow admins to specify the customer
  if (req.user?.role === "admin" || req.user?.role === "super_admin") {
    if (req.body.userId) {
      userId = req.body.userId;
    }
  }

  if (!userId) {
     throw new AppError("Authentication or Customer selection required", 401);
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  // Validate Items, Stock, and Calculate Pricing
  let subtotal = 0;
  const orderItems = [];

  for (const item of validatedBody.items) {
    const product = await ProductModel.findById(item.productId);
    
    if (!product || product.isDeleted) {
      throw new AppError(`Product ${item.name} is no longer available`, 400);
    }

    // Determine correct price and check stock
    let unitPrice = product.price;
    let stockAvailable = product.stock;

    if (item.size) {
      const sizeObj = product.sizes?.find((s) => s.size === item.size);
      if (!sizeObj) {
        throw new AppError(`Size ${item.size} not found for product ${product.nameEn}`, 400);
      }
      unitPrice = sizeObj.price;
      stockAvailable = sizeObj.stock;
    }

    if (stockAvailable < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.nameEn} (Size: ${item.size || "Default"}). Available: ${stockAvailable}`, 400);
    }

    subtotal += unitPrice * item.quantity;
    orderItems.push({
      productId: product._id,
      name: product.nameEn,
      price: unitPrice,
      quantity: item.quantity,
      image: item.image || product.mainImage,
      size: item.size,
    });
  }

  // Get dynamic settings
  let settings = await SettingsModel.findOne();
  if (!settings) {
    settings = await SettingsModel.create({});
  }

  const shippingCost = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost;
  const taxAmount = Math.round(subtotal * (settings.taxRate / 100) * 100) / 100;
  const totalAmount = subtotal + shippingCost + taxAmount;

  // Balance deduction logic if Payment Method is WALLET
  if (validatedBody.paymentMethod === "WALLET") {
     if ((user.totalBalance || 0) < totalAmount) {
        throw new AppError(`Insufficient balance. Current balance: ${user.totalBalance}`, 400);
     }
     // Set payment status to PAID for wallet transactions
     validatedBody.paymentStatus = "PAID";
  }

  // Generate tracking number
  const trackingNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const order = await OrderModel.create({
    ...validatedBody,
    items: orderItems,
    userId,
    subtotal,
    shippingCost,
    taxRate: settings.taxRate,
    taxAmount,
    totalAmount,
    trackingNumber,
  });

  // Create Transaction Record if Payment Method is WALLET
  if (validatedBody.paymentMethod === "WALLET") {
    await TransactionModel.create({
      userId,
      amount: -totalAmount, // Negative for deduction
      type: "PURCHASE",
      status: "COMPLETED",
      description: `Purchase of order ${trackingNumber}`,
      referenceId: order._id.toString(),
    });
  }

  // Deduct Stock
  for (const item of orderItems) {
    if (item.size) {
      // Deduct from specific size AND total stock
      await ProductModel.updateOne(
        { _id: item.productId, "sizes.size": item.size },
        { 
          $inc: { 
            "sizes.$.stock": -item.quantity,
            stock: -item.quantity,
            soldCount: item.quantity 
          } 
        }
      );
    } else {
      // Just total stock
      await ProductModel.findByIdAndUpdate(item.productId, {
        $inc: { 
          stock: -item.quantity,
          soldCount: item.quantity
        }
      });
    }
  }
  
  // Update User Stats
  await UserModel.findByIdAndUpdate(userId, {
    $inc: { totalOrders: 1 },
    $set: { lastTransactionAt: new Date() }
  });

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    data: { order },
  });
};

/**
 * Update order
 */
export const updateOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedBody = updateOrderSchema.parse(req.body);
  
  const order = await OrderModel.findById(id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Update logic with automatic timestamp updates
  const updateData: Record<string, unknown> = { ...validatedBody };
  
  // Set timestamps for status changes
  if (validatedBody.status === "SHIPPED" && order.status !== "SHIPPED") {
    updateData.shippedAt = new Date();
  } else if (validatedBody.status === "DELIVERED" && order.status !== "DELIVERED") {
    updateData.deliveredAt = new Date();
  }

  const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, { new: true })
    .populate("userId", "name phone email")
    .populate("items.productId", "nameAr nameEn mainImage");

  res.status(200).json({
    success: true,
    message: "Order updated successfully",
    data: { order: updatedOrder },
  });
};

/**
 * Cancel order
 */
export const cancelOrder = async (req: Request, res: Response) => {
  const { id } = req.params;

  const order = await OrderModel.findByIdAndUpdate(
    id,
    { status: "CANCELLED" },
    { new: true }
  );

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    data: { order },
  });
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = updateOrderStatusSchema.parse(req.body);

  const order = await OrderModel.findById(id);
  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "SHIPPED" && order.status !== "SHIPPED") {
    updateData.shippedAt = new Date();
  } else if (status === "DELIVERED" && order.status !== "DELIVERED") {
    updateData.deliveredAt = new Date();
  }

  const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, { new: true })
    .populate("userId", "name phone email")
    .populate("items.productId", "nameAr nameEn mainImage");

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    data: { order: updatedOrder },
  });
};

/**
 * Checkout process: Convert cart to order
 */
export const checkout = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const validatedBody = checkoutSchema.parse(req.body);

  // 1. Get User Cart
  const cart = await CartModel.findOne({ userId }).populate({
    path: "items.productId",
    select: "name nameEn nameAr price stock isShow isDeleted images mainImage sizes",
  });

  if (!cart || cart.items.length === 0) {
    throw new AppError("Your cart is empty", 400);
  }

  // 2. Validate Stock and Availability
  let subtotal = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.productId as unknown as IProduct; // Populated product

    const productName = product?.name || product?.nameEn || product?.nameAr || "unknown";
    if (!product || product.isDeleted || product.isShow === false) {
      throw new AppError(`Product ${productName} is no longer available`, 400);
    }

    // Determine price based on size if size is selected
    let unitPrice = product.price;
    let availableStock = product.stock;
    if (item.size && product.sizes && product.sizes.length > 0) {
      const sizeObj = product.sizes.find((s) => s.size === item.size);
      if (sizeObj) {
        unitPrice = sizeObj.price;
        availableStock = sizeObj.stock;
      }
    }
    if (availableStock < item.quantity) {
      throw new AppError(`Product ${productName} only has ${availableStock} items in stock`, 400);
    }

    subtotal += unitPrice * item.quantity;
    orderItems.push({
      productId: product._id,
      name: productName,
      price: unitPrice,
      quantity: item.quantity,
      image: product.images?.main || product.mainImage,
      size: item.size,
    });
  }

  // 3. Pricing & Settings
  let settings = await SettingsModel.findOne();
  if (!settings) {
    settings = await SettingsModel.create({});
  }

  const shippingCost = subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingCost;
  const taxAmount = Math.round(subtotal * (settings.taxRate / 100) * 100) / 100;
  const totalAmount = subtotal + shippingCost + taxAmount;

  // 4. Verify Balance (only for WALLET payment)
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (validatedBody.paymentMethod === "WALLET" && (user.totalBalance || 0) < totalAmount) {
    throw new AppError(`Insufficient balance. Current balance: ${user.totalBalance}`, 400);
  }

  // 5. Atomic Operations (Simulated)
  // Create Order
  const trackingNumber = `SG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const order = await OrderModel.create({
    ...validatedBody,
    userId,
    items: orderItems,
    subtotal,
    shippingCost,
    taxRate: settings.taxRate,
    taxAmount,
    totalAmount,
    trackingNumber,
    paymentMethod: validatedBody.paymentMethod,
    paymentStatus: validatedBody.paymentMethod === "WALLET" ? "PAID" : "PENDING",
    status: "PENDING",
  });

  if (validatedBody.paymentMethod === "WALLET") {
    // Create Transaction Record
    await TransactionModel.create({
      userId,
      amount: -totalAmount, // Negative for deduction
      type: "PURCHASE",
      status: "COMPLETED",
      description: `Purchase of order ${trackingNumber}`,
      referenceId: order._id.toString(),
    });
  }

  // User balance is updated via TransactionModel middleware

  // 6. Deduct Stock
  for (const item of cart.items) {
    const product = item.productId as unknown as IProduct;
    if (item.size && product.sizes && product.sizes.length > 0) {
      // Deduct from specific size AND total stock
      await ProductModel.updateOne(
        { _id: product._id, "sizes.size": item.size },
        { 
          $inc: { 
            "sizes.$.stock": -item.quantity,
            stock: -item.quantity,
            soldCount: item.quantity
          } 
        }
      );
    } else {
      // Just total stock
      await ProductModel.findByIdAndUpdate(product._id, {
        $inc: { 
          stock: -item.quantity,
          soldCount: item.quantity
        }
      });
    }
  }
  
  // Update User Stats
  await UserModel.findByIdAndUpdate(userId, {
    $inc: { totalOrders: 1 },
    $set: { lastTransactionAt: new Date() }
  });

  // Clear Cart
  cart.items = [];
  await cart.save();

  res.status(201).json({
    success: true,
    message: "Checkout successful! Your order has been placed.",
    data: { order },
  });
};

/**
 * Get current user's orders
 */
export const getMyOrders = async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const validatedQuery = queryOrderSchema.parse(req.query);
  const { status, page, limit } = validatedQuery;

  const query: Record<string, unknown> = { userId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    OrderModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("items.productId", "nameAr nameEn mainImage"),
    OrderModel.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    message: "Your orders fetched successfully",
    data: {
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
  });
};

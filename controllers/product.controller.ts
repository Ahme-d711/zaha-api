import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { ProductModel } from "../models/product.model.js";
import { createProductSchema, queryProductSchema, updateProductSchema } from "../schemas/product.schema.js";
import AppError from "../errors/AppError.js";
import ApiFeatures from "../utils/ApiFeatures.js";

export const getAllProducts = async (req: Request, res: Response) => {
  const validatedQuery = queryProductSchema.parse(req.query);
  const query = ProductModel.find({ isDeleted: false }).populate("addedBy", "name email role");

  const apiFeatures = new ApiFeatures(query, validatedQuery)
    .filter()
    .search(["name", "id"])
    .sort()
    .paginate();

  const { results: products, pagination } = await apiFeatures.execute();

  res.status(200).json({
    success: true,
    message: "Products fetched successfully",
    data: { products, pagination },
  });
};

export const getProductById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id).populate("addedBy", "name email role");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: { product },
  });
};

export const getProductBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const product = await ProductModel.findOne({ slug, isDeleted: false }).populate("addedBy", "name email role");

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Product fetched successfully",
    data: { product },
  });
};

export const createProduct = async (req: Request, res: Response) => {
  const validatedBody = createProductSchema.parse(req.body);
  if (!req.user?._id) {
    throw new AppError("You must be logged in to create a product", 401);
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  if (!files?.mainImage?.[0]) {
    throw new AppError("Main image is required", 400);
  }

  const main = `/uploads/products/${files.mainImage[0].filename}`;
  const gallery = files.images?.map((file) => `/uploads/products/${file.filename}`) || [];

  const product = await ProductModel.create({
    ...validatedBody,
    addedBy: req.user._id,
    images: {
      ...(validatedBody.images || {}),
      main,
      gallery,
    },
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { product },
  });
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedBody = updateProductSchema.parse(req.body);
  const product = await ProductModel.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const updateData: Record<string, unknown> = { ...validatedBody };

  if (files?.mainImage?.[0]) {
    const oldMain = product.images?.main;
    if (oldMain) {
      const oldImagePath = path.join(process.cwd(), oldMain);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    updateData.images = {
      ...(validatedBody.images || product.images),
      main: `/uploads/products/${files.mainImage[0].filename}`,
      gallery: files.images?.map((f) => `/uploads/products/${f.filename}`) || product.images.gallery,
    };
  } else if (files?.images?.length) {
    updateData.images = {
      ...(validatedBody.images || product.images),
      gallery: files.images.map((f) => `/uploads/products/${f.filename}`),
    };
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateData, { new: true });
  res.status(200).json({
    success: true,
    message: "Product updated successfully",
    data: { product: updatedProduct },
  });
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await ProductModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "Product deleted successfully",
    data: null,
  });
};

export const toggleProductStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await ProductModel.findById(id);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  product.is_best_seller = !product.is_best_seller;
  await product.save();

  res.status(200).json({
    success: true,
    message: "Product status toggled successfully",
    data: { product },
  });
};

export const restoreProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await ProductModel.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
  if (!product) {
    throw new AppError("Product not found", 404);
  }
  res.status(200).json({
    success: true,
    message: "Product restored successfully",
    data: { product },
  });
};

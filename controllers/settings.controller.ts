import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/sendResponse.js";
import { SettingsModel } from "../models/settings.model.js";

/**
 * Get system settings (Public or Protected based on needs, usually Public for cart calculation)
 */
export const getSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await SettingsModel.findOne();

  // If no settings exist, create default
  if (!settings) {
    settings = await SettingsModel.create({});
  }

  sendResponse(res, 200, {
    success: true,
    message: "Settings retrieved successfully",
    data: settings,
  });
});

/**
 * Update system settings (Admin only)
 */
export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  let settings = await SettingsModel.findOne();

  if (!settings) {
    settings = await SettingsModel.create(req.body);
  } else {
    // Update fields
    if (req.body.shippingCost !== undefined) settings.shippingCost = req.body.shippingCost;
    if (req.body.taxRate !== undefined) settings.taxRate = req.body.taxRate;
    if (req.body.freeShippingThreshold !== undefined) settings.freeShippingThreshold = req.body.freeShippingThreshold;
    if (req.body.currency !== undefined) settings.currency = req.body.currency;
    if (req.body.contactEmail !== undefined) settings.contactEmail = req.body.contactEmail;
    if (req.body.contactPhone !== undefined) settings.contactPhone = req.body.contactPhone;
    if (req.body.socialLinks !== undefined) settings.socialLinks = req.body.socialLinks;
    
    await settings.save();
  }

  sendResponse(res, 200, {
    success: true,
    message: "Settings updated successfully",
    data: settings,
  });
});

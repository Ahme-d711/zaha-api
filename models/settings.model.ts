import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  shippingCost: number;
  taxRate: number;
  freeShippingThreshold: number;
  currency: string;
  contactEmail?: string;
  contactPhone?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
  };
}

const settingsSchema = new Schema<ISettings>(
  {
    shippingCost: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    freeShippingThreshold: { type: Number, default: 0 },
    currency: { type: String, default: "EGP" },
    contactEmail: { type: String },
    contactPhone: { type: String },
    socialLinks: {
      facebook: { type: String },
      instagram: { type: String },
      twitter: { type: String },
      whatsapp: { type: String },
    },
  },
  { timestamps: true }
);

export const SettingsModel = mongoose.model<ISettings>("Settings", settingsSchema);

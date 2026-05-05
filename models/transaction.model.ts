import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: "DEPOSIT" | "WITHDRAW" | "PURCHASE" | "REFUND";
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
  description?: string;
  referenceId?: string; // e.g. Order ID or external payment ID
  paymentMethod?: string;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAW", "PURCHASE", "REFUND"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "PENDING",
    },
    description: { type: String },
    referenceId: { type: String },
    paymentMethod: { type: String },
  },
  { timestamps: true }
);

// Optional: Add index for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });

export const TransactionModel = mongoose.model<ITransaction>("Transaction", transactionSchema);

import { Document, Types } from "mongoose";

export type TransactionType = "TOPUP" | "PURCHASE" | "REFUND" | "BONUS";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  referenceId?: string; // e.g., Order ID or external payment ID
  createdAt: Date;
  updatedAt: Date;
}

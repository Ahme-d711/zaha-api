import { IUser } from "./user.type.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        email: string;
        role: string;
        name: string;
      };
    }
  }
}

export {};


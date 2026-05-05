import type{ Response } from "express";

interface IResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  payload: IResponse<T>
) => {
  res.status(statusCode).json(payload);
};

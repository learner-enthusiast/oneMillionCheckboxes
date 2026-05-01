import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

export const healthCheckController = asyncHandler(
  async (_req: Request, res: Response) => {
    return res.status(200).json(new ApiResponse(200, {}, "Token is healthy"));
  },
);

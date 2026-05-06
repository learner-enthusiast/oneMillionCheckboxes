import type { Request, Response } from "express";
import { signAccessToken } from "../utils/jwt";
import { ApiResponse } from "../utils/ApiResponse.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { ApiError } from "../utils/ApiError.ts";

type FreeApiCurrentUserResponse = {
  data?: {
    _id?: string;
    id?: string;
    email?: string;
    username?: string;
    role?: string;
  };
};

export const authExchangeFromFreeApi = asyncHandler(
  async (req: Request, res: Response) => {
    const freeApiToken = String(req.params.code ?? "").trim();
    if (!freeApiToken) {
      throw new ApiError(400, "Missing FreeAPI token");
    }

    const freeApiRes = await fetch(
      "https://api.freeapi.app/api/v1/users/current-user",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${freeApiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!freeApiRes.ok) {
      throw new ApiError(401, "Invalid FreeAPI token");
    }

    const freeApiJson = (await freeApiRes.json()) as FreeApiCurrentUserResponse;
    const user = freeApiJson.data;
    const userId = user?._id || user?.id;
    console.log(user);
    if (!user || !userId) {
      throw new ApiError(401, "Invalid FreeAPI token");
    }
    console.log(userId);
    const userDetails = {
      userId: userId,
      email: String(user.email ?? ""),
      username: String(user.username ?? user.email ?? "user"),
    };

    const accessToken = signAccessToken(userDetails);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
        },
        "Login successful",
      ),
    );
  },
);

export default {
  authExchangeFromFreeApi,
};

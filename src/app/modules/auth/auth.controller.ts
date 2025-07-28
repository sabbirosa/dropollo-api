import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { setAuthCookie } from "../../utils/setCookie";
import { AuthService } from "./auth.service";

// Register new user
const register = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;

  const newUser = await AuthService.registerUser(userData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User registered successfully",
    data: newUser,
  });
});

// Login user
const login = catchAsync(async (req: Request, res: Response) => {
  const loginData = req.body;

  const result = await AuthService.loginUser(loginData);

  // Set tokens in cookies
  setAuthCookie(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged in successfully",
    data: {
      user: result.user,
      accessToken: result.accessToken,
    },
  });
});

// Get current user profile
const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const user = await AuthService.getMyProfile(userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile retrieved successfully",
    data: user,
  });
});

// Update user profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const updateData = req.body;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const updatedUser = await AuthService.updateProfile(userId, updateData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Profile updated successfully",
    data: updatedUser,
  });
});

// Change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const passwordData = req.body;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  await AuthService.changePassword(userId, passwordData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

// Logout user
const logout = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  await AuthService.logoutUser(userId);

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});

// Refresh access token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies || req.body;

  if (!refreshToken) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Refresh token not provided");
  }

  const result = await AuthService.refreshToken(refreshToken);

  // Set new access token in cookie
  setAuthCookie(res, { accessToken: result.accessToken });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

export const AuthController = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout,
  refreshToken,
};

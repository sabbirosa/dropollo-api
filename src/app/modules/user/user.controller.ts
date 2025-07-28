import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { UserService } from './user.service';

// Get all users (Admin only)
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query as Record<string, any>);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Users retrieved successfully',
    data: result.users,
    meta: result.meta,
  });
});

// Get user by ID (Admin only)
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = await UserService.getUserById(id);
  
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
});

// Get current user profile
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  
  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const user = await UserService.getUserById(userId);
  
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, 'User profile not found');
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile retrieved successfully',
    data: user,
  });
});

// Update user profile
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const updateData = req.body;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  const updatedUser = await UserService.updateUser(userId, updateData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

// Update user role (Admin only)
const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  const updatedUser = await UserService.updateUserRole(id, role);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User role updated successfully',
    data: updatedUser,
  });
});

// Block/Unblock user (Admin only)
const blockUnblockUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isBlocked } = req.body;

  // Prevent admin from blocking themselves
  if (req.user?.userId === id && isBlocked) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot block yourself');
  }

  const updatedUser = await UserService.blockUnblockUser(id, isBlocked);

  const action = isBlocked ? 'blocked' : 'unblocked';
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `User ${action} successfully`,
    data: updatedUser,
  });
});

// Change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const passwordData = req.body;

  if (!userId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
  }

  await UserService.changePassword(userId, passwordData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password changed successfully',
    data: null,
  });
});

// Delete user (Admin only)
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Prevent admin from deleting themselves
  if (req.user?.userId === id) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot delete yourself');
  }

  await UserService.deleteUser(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User deleted successfully',
    data: null,
  });
});

// Get user statistics (Admin only)
const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await UserService.getUserStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User statistics retrieved successfully',
    data: stats,
  });
});

export const UserController = {
  getAllUsers,
  getUserById,
  getMyProfile,
  updateProfile,
  updateUserRole,
  blockUnblockUser,
  changePassword,
  deleteUser,
  getUserStats,
}; 
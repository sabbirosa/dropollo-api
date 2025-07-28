import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AppError from '../../errorHelpers/AppError';
import { UserService } from './user.service';

interface IAuthenticatedUser {
  userId: string;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  currentUser?: IAuthenticatedUser;
}

// Get all users (Admin only)
const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await UserService.getAllUsers(page, limit, search);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    throw error;
  }
};

// Get user by ID (Admin only)
const getUserById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await UserService.getUserById(id);
    
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error) {
    throw error;
  }
};

// Get current user profile
const getMyProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.currentUser?.userId;
    
    if (!userId) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const user = await UserService.getUserById(userId);
    
    if (!user) {
      throw new AppError(StatusCodes.NOT_FOUND, 'User profile not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: user,
    });
  } catch (error) {
    throw error;
  }
};

// Update user profile
const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.currentUser?.userId;
    const updateData = req.body;

    if (!userId) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    const updatedUser = await UserService.updateUser(userId, updateData);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    throw error;
  }
};

// Update user role (Admin only)
const updateUserRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updatedUser = await UserService.updateUserRole(id, role);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User role updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    throw error;
  }
};

// Block/Unblock user (Admin only)
const blockUnblockUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    // Prevent admin from blocking themselves
    if (req.currentUser?.userId === id && isBlocked) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot block yourself');
    }

    const updatedUser = await UserService.blockUnblockUser(id, isBlocked);

    const action = isBlocked ? 'blocked' : 'unblocked';
    res.status(StatusCodes.OK).json({
      success: true,
      message: `User ${action} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    throw error;
  }
};

// Change password
const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.currentUser?.userId;
    const passwordData = req.body;

    if (!userId) {
      throw new AppError(StatusCodes.UNAUTHORIZED, 'User not authenticated');
    }

    await UserService.changePassword(userId, passwordData);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    throw error;
  }
};

// Delete user (Admin only)
const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (req.currentUser?.userId === id) {
      throw new AppError(StatusCodes.BAD_REQUEST, 'You cannot delete yourself');
    }

    await UserService.deleteUser(id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    throw error;
  }
};

// Get user statistics (Admin only)
const getUserStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await UserService.getUserStats();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    throw error;
  }
};

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
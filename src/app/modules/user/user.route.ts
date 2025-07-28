import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';

const router = express.Router();

// Note: Authentication and authorization middlewares will be added later
// when auth module is implemented

// Admin-only routes
router.get('/', UserController.getAllUsers); // Get all users (admin only)
router.get('/stats', UserController.getUserStats); // Get user statistics (admin only)
router.get('/:id', UserController.getUserById); // Get user by ID (admin only)
router.put('/:id/role', 
  validateRequest(UserValidation.updateUserRoleValidationSchema),
  UserController.updateUserRole
); // Update user role (admin only)
router.put('/:id/block', 
  validateRequest(UserValidation.blockUserValidationSchema),
  UserController.blockUnblockUser
); // Block/unblock user (admin only)
router.delete('/:id', UserController.deleteUser); // Delete user (admin only)

// User profile routes (authenticated users)
router.get('/profile/me', UserController.getMyProfile); // Get current user profile
router.put('/profile/update', 
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateProfile
); // Update user profile
router.put('/profile/change-password', 
  validateRequest(UserValidation.changePasswordValidationSchema),
  UserController.changePassword
); // Change password

export const UserRoutes = router;

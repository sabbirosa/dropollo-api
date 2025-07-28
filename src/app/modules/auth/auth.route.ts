import express from 'express';
import { checkAuth } from '../../middlewares/checkAuth';
import { validateRequest } from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';

const router = express.Router();

// Public routes (no authentication required)
router.post('/register', 
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register
); // User registration

router.post('/login', 
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
); // User login

router.post('/refresh-token', 
  AuthController.refreshToken
); // Refresh access token

// Protected routes (authentication required)
router.get('/me', 
  checkAuth('admin', 'sender', 'receiver'),
  AuthController.getMe
); // Get current user profile

router.put('/profile', 
  checkAuth('admin', 'sender', 'receiver'),
  validateRequest(AuthValidation.updateProfileValidationSchema),
  AuthController.updateProfile
); // Update user profile

router.put('/change-password', 
  checkAuth('admin', 'sender', 'receiver'),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
); // Change password

router.post('/logout', 
  checkAuth('admin', 'sender', 'receiver'),
  AuthController.logout
); // User logout

export const AuthRoutes = router;

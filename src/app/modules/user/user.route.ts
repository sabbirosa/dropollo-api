import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// Admin-only routes
router.get("/", checkAuth("admin"), UserController.getAllUsers); // Get all users (admin only)

router.get("/stats", checkAuth("admin"), UserController.getUserStats); // Get user statistics (admin only)

router.get("/:id", checkAuth("admin"), UserController.getUserById); // Get user by ID (admin only)

router.put(
  "/:id/role",
  checkAuth("admin"),
  validateRequest(UserValidation.updateUserRoleValidationSchema),
  UserController.updateUserRole
); // Update user role (admin only)

router.put(
  "/:id/block",
  checkAuth("admin"),
  validateRequest(UserValidation.blockUserValidationSchema),
  UserController.blockUnblockUser
); // Block/unblock user (admin only)

router.delete("/:id", checkAuth("admin"), UserController.deleteUser); // Delete user (admin only)

// User profile routes (authenticated users)
router.get(
  "/profile/me",
  checkAuth("admin", "sender", "receiver"),
  UserController.getMyProfile
); // Get current user profile

router.put(
  "/profile/update",
  checkAuth("admin", "sender", "receiver"),
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateProfile
); // Update user profile

router.put(
  "/profile/change-password",
  checkAuth("admin", "sender", "receiver"),
  validateRequest(UserValidation.changePasswordValidationSchema),
  UserController.changePassword
); // Change password

export const UserRoutes = router;

import express from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

// Public routes (no authentication required)
router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.register
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.login
);

router.post("/refresh-token", AuthController.refreshToken);

// Protected routes (authentication required)
router.get(
  "/me",
  checkAuth("admin", "sender", "receiver"),
  AuthController.getMe
);

router.put(
  "/profile",
  checkAuth("admin", "sender", "receiver"),
  validateRequest(AuthValidation.updateProfileValidationSchema),
  AuthController.updateProfile
);

router.put(
  "/change-password",
  checkAuth("admin", "sender", "receiver"),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

router.post(
  "/logout",
  checkAuth("admin", "sender", "receiver"),
  AuthController.logout
);

export const AuthRoutes = router;

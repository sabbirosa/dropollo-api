import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import { envVars } from "../../config/env";
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

router.get("/google", (req: Request, res: Response, next: NextFunction) => {
  const redirect = req.query.redirect || "/";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: redirect as string,
  })(req, res, next);
});

// api/v1/auth/google/callback?state=/parcel
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${envVars.FRONTEND_URL}/login?error=There is some issues with your account. Please contact with out support team!`,
  }),
  AuthController.googleCallbackController
);

export const AuthRoutes = router;

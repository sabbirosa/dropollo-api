import AppError from "../../errorHelpers/AppError";
import {
  createNewAccessTokenWithRefreshToken,
  createUserTokens,
} from "../../utils/userTokens";
import { IsActive } from "../user/user.interface";
import type { IUser } from "../user/user.model";
import { User } from "../user/user.model";
import type {
  IAuthResponse,
  IChangePassword,
  ILoginUser,
  IRegisterUser,
  IUpdateProfile,
} from "./auth.interface";

const registerUser = async (
  userData: IRegisterUser
): Promise<Omit<IUser, "password">> => {
  // Check if user already exists

  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError(409, "User with this email already exists");
  }

  // Set default role if not provided
  if (!userData.role) {
    userData.role = "sender";
  }

  // Create new user
  const newUser = await User.create({
    ...userData,
    isVerified: true, // Auto-verify for now, can be changed later
    isActive: IsActive.ACTIVE,
    isDeleted: false,
  });

  // Return user without password
  const userObject = newUser.toObject();

  // Exclude password from user object
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = userObject;

  return userWithoutPassword;
};

const loginUser = async (loginData: ILoginUser): Promise<IAuthResponse> => {
  // Find user with password
  const user = await User.findOne({ email: loginData.email }).select(
    "+password"
  );

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new AppError(401, "Please verify your email first");
  }

  // Check if user is active
  if (user.isActive === IsActive.BLOCKED) {
    throw new AppError(401, "Your account has been blocked");
  }

  if (user.isActive === IsActive.INACTIVE) {
    throw new AppError(401, "Your account is inactive");
  }

  // Check if user is deleted
  if (user.isDeleted) {
    throw new AppError(401, "This account no longer exists");
  }

  // Verify password
  const isPasswordValid = await user.isPasswordMatched(
    loginData.password,
    user.password
  );

  if (!isPasswordValid) {
    throw new AppError(401, "Invalid email or password");
  }

  // Generate JWT tokens using userTokens utility
  const tokens = createUserTokens(user);

  // Return user data without password and tokens
  const userObject = user.toObject();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = userObject;

  return {
    user: userWithoutPassword,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

const getMyProfile = async (
  userId: string
): Promise<Omit<IUser, "password"> | null> => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new AppError(404, "User profile not found");
  }

  return user;
};

const updateProfile = async (
  userId: string,
  updateData: IUpdateProfile
): Promise<Omit<IUser, "password"> | null> => {
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!updatedUser) {
    throw new AppError(404, "User not found");
  }

  return updatedUser;
};

const changePassword = async (
  userId: string,
  passwordData: IChangePassword
): Promise<void> => {
  // Get user with password
  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Check if current password is correct
  const isCurrentPasswordValid = await user.isPasswordMatched(
    passwordData.currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new AppError(400, "Current password is incorrect");
  }

  // Check if new password is different from current password
  const isSamePassword = await user.isPasswordMatched(
    passwordData.newPassword,
    user.password
  );

  if (isSamePassword) {
    throw new AppError(
      400,
      "New password must be different from current password"
    );
  }

  // Update password (will be hashed automatically by pre-save middleware)
  user.password = passwordData.newPassword;
  await user.save();
};

const refreshToken = async (
  token: string
): Promise<{ accessToken: string }> => {
  const accessToken = await createNewAccessTokenWithRefreshToken(token);

  return {
    accessToken,
  };
};

const logoutUser = async (userId: string): Promise<void> => {
  // For JWT logout, we would typically blacklist the token
  // For now, we'll just validate that the user exists
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // In a real implementation, you might:
  // 1. Add the token to a blacklist/redis cache
  // 2. Update user's tokenVersion to invalidate all tokens
  // 3. Clear any stored refresh tokens

  // For now, we'll just return success
};

export const AuthService = {
  registerUser,
  loginUser,
  getMyProfile,
  updateProfile,
  changePassword,
  refreshToken,
  logoutUser,
};

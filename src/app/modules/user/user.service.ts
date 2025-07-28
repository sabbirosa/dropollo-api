import AppError from '../../errorHelpers/AppError';
import { QueryBuilder } from '../../utils/QueryBuilder';
import type { IUser } from './user.model';
import { User } from './user.model';

interface ICreateUser {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  role?: 'admin' | 'sender' | 'receiver';
}

interface IUpdateUser {
  name?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

interface IChangePassword {
  currentPassword: string;
  newPassword: string;
}

interface IUserStats {
  totalUsers: number;
  adminCount: number;
  senderCount: number;
  receiverCount: number;
  blockedUsers: number;
  activeUsers: number;
}

const createUser = async (userData: ICreateUser): Promise<Omit<IUser, 'password'>> => {
  // Check if user already exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new AppError(409, 'User with this email already exists');
  }

  // Create new user
  const newUser = await User.create(userData);
  
  // Return user without password
  const userObject = newUser.toObject();
  delete (userObject as any).password;
  
  return userObject;
};

const getAllUsers = async (query: Record<string, any>) => {
  const searchableFields = ['name', 'email', 'phone'];
  
  const userQuery = new QueryBuilder(User.find().select('-password') as any, query)
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const users = await userQuery.build();
  const meta = await userQuery.getMeta();

  return {
    users,
    meta,
  };
};

const getUserById = async (userId: string): Promise<Omit<IUser, 'password'> | null> => {
  const user = await User.findById(userId).select('-password');
  return user;
};

const getUserByEmail = async (email: string): Promise<IUser | null> => {
  const user = await User.findOne({ email }).select('+password');
  return user;
};

const updateUser = async (
  userId: string,
  updateData: IUpdateUser,
): Promise<Omit<IUser, 'password'> | null> => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    throw new AppError(404, 'User not found');
  }

  return updatedUser;
};

const updateUserRole = async (
  userId: string,
  role: 'admin' | 'sender' | 'receiver',
): Promise<Omit<IUser, 'password'> | null> => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    throw new AppError(404, 'User not found');
  }

  return updatedUser;
};

const blockUnblockUser = async (
  userId: string,
  isBlocked: boolean,
): Promise<Omit<IUser, 'password'> | null> => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { isBlocked },
    { new: true, runValidators: true }
  ).select('-password');

  if (!updatedUser) {
    throw new AppError(404, 'User not found');
  }

  return updatedUser;
};

const changePassword = async (
  userId: string,
  passwordData: IChangePassword,
): Promise<void> => {
  // Get user with password
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Check if current password is correct
  const isCurrentPasswordValid = await user.isPasswordMatched(
    passwordData.currentPassword,
    user.password,
  );

  if (!isCurrentPasswordValid) {
    throw new AppError(400, 'Current password is incorrect');
  }

  // Check if new password is different from current password
  const isSamePassword = await user.isPasswordMatched(
    passwordData.newPassword,
    user.password,
  );

  if (isSamePassword) {
    throw new AppError(400, 'New password must be different from current password');
  }

  // Update password (will be hashed automatically by pre-save middleware)
  user.password = passwordData.newPassword;
  await user.save();
};

const deleteUser = async (userId: string): Promise<void> => {
  const deletedUser = await User.findByIdAndDelete(userId);
  
  if (!deletedUser) {
    throw new AppError(404, 'User not found');
  }
};

const getUserStats = async (): Promise<IUserStats> => {
  const totalUsers = await User.countDocuments();
  const adminCount = await User.countDocuments({ role: 'admin' });
  const senderCount = await User.countDocuments({ role: 'sender' });
  const receiverCount = await User.countDocuments({ role: 'receiver' });
  const blockedUsers = await User.countDocuments({ isBlocked: true });
  const activeUsers = await User.countDocuments({ isBlocked: false });

  return {
    totalUsers,
    adminCount,
    senderCount,
    receiverCount,
    blockedUsers,
    activeUsers,
  };
};

const checkUserExists = async (userId: string): Promise<boolean> => {
  const user = await User.findById(userId);
  return !!user;
};

const isUserBlocked = async (userId: string): Promise<boolean> => {
  const user = await User.findById(userId);
  return user?.isBlocked || false;
};

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  updateUserRole,
  blockUnblockUser,
  changePassword,
  deleteUser,
  getUserStats,
  checkUserExists,
  isUserBlocked,
}; 
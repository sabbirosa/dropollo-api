import bcrypt from 'bcrypt';
import { model, Model, Schema } from 'mongoose';
import { IsActive } from './user.interface';

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: IAddress;
  role: 'admin' | 'sender' | 'receiver';
  isBlocked: boolean;
  isVerified: boolean;
  isActive: IsActive;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserMethods {
  isPasswordMatched(givenPassword: string, savedPassword: string): Promise<boolean>;
}

export type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const addressSchema = new Schema<IAddress>({
  street: {
    type: String,
    required: [true, 'Street is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  zipCode: {
    type: String,
    required: [true, 'Zip code is required'],
    trim: true,
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
  },
}, { _id: false, versionKey: false });

const userSchema = new Schema<IUser, UserModel, IUserMethods>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number'],
  },
  address: {
    type: addressSchema,
    required: [true, 'Address is required'],
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'sender', 'receiver'],
      message: 'Role must be admin, sender, or receiver',
    },
    required: [true, 'Role is required'],
    default: 'sender',
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: String,
    enum: Object.values(IsActive),
    default: IsActive.ACTIVE,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  versionKey: false
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to check password
userSchema.methods.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
};

export const User = model<IUser, UserModel>('User', userSchema); 
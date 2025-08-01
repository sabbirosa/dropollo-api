import { z } from "zod";

const addressValidationSchema = z.object({
  street: z.string().min(1, "Street is required").trim(),
  city: z.string().min(1, "City is required").trim(),
  state: z.string().min(1, "State is required").trim(),
  zipCode: z.string().min(1, "Zip code is required").trim(),
  country: z.string().min(1, "Country is required").trim(),
});

const createUserValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name cannot exceed 50 characters")
      .trim(),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address")
      .toLowerCase(),

    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),

    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number")
      .trim(),

    address: addressValidationSchema,

    role: z.enum(["admin", "sender", "receiver"]).default("sender"),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(50, "Name cannot exceed 50 characters")
      .trim()
      .optional(),

    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number")
      .trim()
      .optional(),

    address: addressValidationSchema.optional(),
  }),
});

const updateUserRoleValidationSchema = z.object({
  body: z.object({
    role: z.enum(["admin", "sender", "receiver"]),
  }),
});

const blockUserValidationSchema = z.object({
  body: z.object({
    isBlocked: z.boolean(),
  }),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(1, "New password is required")
      .min(8, "New password must be at least 8 characters long")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "New password must contain at least one lowercase letter, one uppercase letter, and one number"
      ),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
  updateUserRoleValidationSchema,
  blockUserValidationSchema,
  changePasswordValidationSchema,
};

import { z } from "zod";
import { ParcelStatus } from "./parcel.interface";

// Address validation schema
const addressSchema = z.object({
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  zipCode: z.string().trim().min(1, "Zip code is required"),
  country: z.string().trim().min(1, "Country is required"),
});

// Receiver validation schema
const receiverSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Receiver name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z.string().email("Invalid email format").toLowerCase(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format"),
  address: addressSchema,
});

// Dimensions validation schema
const dimensionsSchema = z
  .object({
    length: z.number().min(0.1, "Length must be greater than 0"),
    width: z.number().min(0.1, "Width must be greater than 0"),
    height: z.number().min(0.1, "Height must be greater than 0"),
  })
  .optional();

// Parcel details validation schema
const parcelDetailsSchema = z.object({
  type: z.enum(["document", "package", "fragile", "electronics", "other"], {
    message: "Type must be document, package, fragile, electronics, or other",
  }),
  weight: z
    .number()
    .min(0.1, "Weight must be at least 0.1 kg")
    .max(50, "Weight cannot exceed 50 kg"),
  dimensions: dimensionsSchema,
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(500, "Description cannot exceed 500 characters"),
  value: z.number().min(0, "Value cannot be negative").optional(),
});

// Delivery info validation schema
const deliveryInfoSchema = z.object({
  preferredDeliveryDate: z.coerce
    .date()
    .refine((date) => date > new Date(), {
      message: "Preferred delivery date must be in the future",
    })
    .optional(),
  deliveryInstructions: z
    .string()
    .trim()
    .max(1000, "Delivery instructions cannot exceed 1000 characters")
    .optional(),
  urgency: z
    .enum(["standard", "express", "urgent"], {
      message: "Urgency must be standard, express, or urgent",
    })
    .default("standard"),
});

// Create parcel validation
export const createParcelValidation = z.object({
  body: z.object({
    receiver: receiverSchema,
    parcelDetails: parcelDetailsSchema,
    deliveryInfo: deliveryInfoSchema,
  }),
});

// Update parcel validation (partial updates allowed)
export const updateParcelValidation = z.object({
  body: z.object({
    receiver: receiverSchema.partial().optional(),
    parcelDetails: parcelDetailsSchema.partial().optional(),
    deliveryInfo: deliveryInfoSchema.partial().optional(),
  }),
});

// Update parcel status validation
export const updateParcelStatusValidation = z.object({
  body: z.object({
    status: z.nativeEnum(ParcelStatus, {
      message: "Invalid parcel status",
    }),
    location: z.string().trim().optional(),
    note: z
      .string()
      .trim()
      .max(500, "Note cannot exceed 500 characters")
      .optional(),
  }),
});

// Confirm delivery validation
export const confirmDeliveryValidation = z.object({
  body: z.object({
    note: z
      .string()
      .trim()
      .max(500, "Note cannot exceed 500 characters")
      .optional(),
  }),
});

// Query parameters validation for get parcels
export const getParcelQueryValidation = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    sort: z.string().optional(),
    fields: z.string().optional(),
    searchTerm: z.string().trim().optional(),
    status: z.nativeEnum(ParcelStatus).optional(),
    sender: z.string().trim().optional(),
    receiverEmail: z.string().email().optional(),
    trackingId: z.string().trim().optional(),
    urgency: z.enum(["standard", "express", "urgent"]).optional(),
    startDate: z.string().pipe(z.coerce.date()).optional(),
    endDate: z.string().pipe(z.coerce.date()).optional(),
  }),
});

// Track parcel validation (by tracking ID)
export const trackParcelValidation = z.object({
  params: z.object({
    trackingId: z
      .string()
      .trim()
      .regex(/^TRK-\d{8}-\d{6}$/, "Invalid tracking ID format"),
  }),
});

// Parcel ID validation
export const parcelIdValidation = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid parcel ID format"),
  }),
});

// Assign delivery personnel validation
export const assignDeliveryPersonnelValidation = z.object({
  body: z.object({
    deliveryPersonnelId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format"),
  }),
});

// Block/unblock parcel validation
export const blockParcelValidation = z.object({
  body: z.object({
    isBlocked: z.boolean(),
    reason: z
      .string()
      .trim()
      .max(500, "Reason cannot exceed 500 characters")
      .optional(),
  }),
});

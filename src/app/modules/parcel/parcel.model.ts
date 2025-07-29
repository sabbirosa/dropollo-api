import { model, Model, Schema } from 'mongoose';
import {
    IDeliveryInfo,
    IParcel,
    IParcelDetails,
    IParcelReceiver,
    IPricing,
    IStatusLog,
    ParcelStatus
} from './parcel.interface';

export type ParcelModel = Model<IParcel>;

// Status Log Schema
const statusLogSchema = new Schema<IStatusLog>({
  status: {
    type: String,
    enum: Object.values(ParcelStatus),
    required: [true, 'Status is required'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: [true, 'Timestamp is required'],
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Updated by user is required'],
  },
  location: {
    type: String,
    trim: true,
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, 'Note cannot exceed 500 characters'],
  },
}, { _id: false, versionKey: false });

// Address Schema (for receiver)
const addressSchema = new Schema({
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

// Receiver Schema
const receiverSchema = new Schema<IParcelReceiver>({
  name: {
    type: String,
    required: [true, 'Receiver name is required'],
    trim: true,
    minlength: [2, 'Receiver name must be at least 2 characters long'],
  },
  email: {
    type: String,
    required: [true, 'Receiver email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  phone: {
    type: String,
    required: [true, 'Receiver phone is required'],
    trim: true,
    match: [/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'],
  },
  address: {
    type: addressSchema,
    required: [true, 'Receiver address is required'],
  },
}, { _id: false, versionKey: false });

// Dimensions Schema
const dimensionsSchema = new Schema({
  length: {
    type: Number,
    min: [0.1, 'Length must be greater than 0'],
  },
  width: {
    type: Number,
    min: [0.1, 'Width must be greater than 0'],
  },
  height: {
    type: Number,
    min: [0.1, 'Height must be greater than 0'],
  },
}, { _id: false, versionKey: false });

// Parcel Details Schema
const parcelDetailsSchema = new Schema<IParcelDetails>({
  type: {
    type: String,
    enum: {
      values: ['document', 'package', 'fragile', 'electronics', 'other'],
      message: 'Type must be document, package, fragile, electronics, or other',
    },
    required: [true, 'Parcel type is required'],
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [0.1, 'Weight must be at least 0.1 kg'],
    max: [50, 'Weight cannot exceed 50 kg'],
  },
  dimensions: {
    type: dimensionsSchema,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  value: {
    type: Number,
    min: [0, 'Value cannot be negative'],
  },
}, { _id: false, versionKey: false });

// Delivery Info Schema
const deliveryInfoSchema = new Schema<IDeliveryInfo>({
  preferredDeliveryDate: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        return !date || date > new Date();
      },
      message: 'Preferred delivery date must be in the future',
    },
  },
  deliveryInstructions: {
    type: String,
    trim: true,
    maxlength: [1000, 'Delivery instructions cannot exceed 1000 characters'],
  },
  urgency: {
    type: String,
    enum: {
      values: ['standard', 'express', 'urgent'],
      message: 'Urgency must be standard, express, or urgent',
    },
    required: [true, 'Urgency is required'],
    default: 'standard',
  },
}, { _id: false, versionKey: false });

// Pricing Schema
const pricingSchema = new Schema<IPricing>({
  baseFee: {
    type: Number,
    required: [true, 'Base fee is required'],
    min: [0, 'Base fee cannot be negative'],
  },
  weightFee: {
    type: Number,
    required: [true, 'Weight fee is required'],
    min: [0, 'Weight fee cannot be negative'],
  },
  urgencyFee: {
    type: Number,
    required: [true, 'Urgency fee is required'],
    min: [0, 'Urgency fee cannot be negative'],
  },
  totalFee: {
    type: Number,
    required: [true, 'Total fee is required'],
    min: [0, 'Total fee cannot be negative'],
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
  },
  couponCode: {
    type: String,
    trim: true,
    uppercase: true,
  },
}, { _id: false, versionKey: false });

// Main Parcel Schema
const parcelSchema = new Schema<IParcel, ParcelModel>({
  trackingId: {
    type: String,
    required: [true, 'Tracking ID is required'],
    unique: true,
    trim: true,
    match: [/^TRK-\d{8}-\d{6}$/, 'Invalid tracking ID format'],
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required'],
  },
  receiver: {
    type: receiverSchema,
    required: [true, 'Receiver information is required'],
  },
  parcelDetails: {
    type: parcelDetailsSchema,
    required: [true, 'Parcel details are required'],
  },
  deliveryInfo: {
    type: deliveryInfoSchema,
    required: [true, 'Delivery information is required'],
  },
  pricing: {
    type: pricingSchema,
    required: [true, 'Pricing information is required'],
  },
  currentStatus: {
    type: String,
    enum: Object.values(ParcelStatus),
    default: ParcelStatus.REQUESTED,
    required: [true, 'Current status is required'],
  },
  statusHistory: {
    type: [statusLogSchema],
    default: [],
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  isCancelled: {
    type: Boolean,
    default: false,
  },
  deliveryPersonnel: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for better performance
parcelSchema.index({ trackingId: 1 });
parcelSchema.index({ sender: 1 });
parcelSchema.index({ 'receiver.email': 1 });
parcelSchema.index({ currentStatus: 1 });
parcelSchema.index({ createdAt: -1 });
parcelSchema.index({ 'deliveryInfo.urgency': 1 });

// Pre-save middleware to add initial status log
parcelSchema.pre('save', function(next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: ParcelStatus.REQUESTED,
      timestamp: new Date(),
      updatedBy: this.sender,
      note: 'Parcel request created'
    });
  }
  next();
});

export const Parcel = model<IParcel, ParcelModel>('Parcel', parcelSchema); 
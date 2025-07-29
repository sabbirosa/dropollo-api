import { ObjectId } from 'mongoose';

export enum ParcelStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  FAILED_DELIVERY = 'failed_delivery'
}

export interface IStatusLog {
  status: ParcelStatus;
  timestamp: Date;
  updatedBy: ObjectId; // Reference to User
  location?: string;
  note?: string;
}

export interface IParcelReceiver {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface IParcelDetails {
  type: 'document' | 'package' | 'fragile' | 'electronics' | 'other';
  weight: number; // in kg
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  description: string;
  value?: number;
}

export interface IDeliveryInfo {
  preferredDeliveryDate?: Date;
  deliveryInstructions?: string;
  urgency: 'standard' | 'express' | 'urgent';
}

export interface IPricing {
  baseFee: number;
  weightFee: number;
  urgencyFee: number;
  totalFee: number;
  discount?: number;
  couponCode?: string;
}

export interface IParcel {
  _id: ObjectId;
  trackingId: string; // Format: TRK-YYYYMMDD-XXXXXX
  sender: ObjectId; // Reference to User
  receiver: IParcelReceiver;
  parcelDetails: IParcelDetails;
  deliveryInfo: IDeliveryInfo;
  pricing: IPricing;
  currentStatus: ParcelStatus;
  statusHistory: IStatusLog[]; // Embedded status logs
  isBlocked: boolean;
  isCancelled: boolean;
  deliveryPersonnel?: ObjectId; // Reference to User (optional)
  createdAt: Date;
  updatedAt: Date;
}

// Input interfaces for API operations
export interface ICreateParcel {
  receiver: IParcelReceiver;
  parcelDetails: IParcelDetails;
  deliveryInfo: IDeliveryInfo;
}

export interface IUpdateParcelStatus {
  status: ParcelStatus;
  location?: string;
  note?: string;
}

export interface IUpdateParcel {
  receiver?: Partial<IParcelReceiver>;
  parcelDetails?: Partial<IParcelDetails>;
  deliveryInfo?: Partial<IDeliveryInfo>;
}

export interface IParcelFilters {
  status?: ParcelStatus;
  sender?: string;
  receiverEmail?: string;
  trackingId?: string;
  startDate?: Date;
  endDate?: Date;
  urgency?: 'standard' | 'express' | 'urgent';
} 
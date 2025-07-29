import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../errorHelpers/AppError';
import { calculateParcelFee, validateFeeCalculationInput } from '../../utils/feeCalculator';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { generateTrackingId } from '../../utils/tracking';
import { User } from '../user/user.model';
import {
  ICreateParcel,
  IParcel,
  IUpdateParcel,
  IUpdateParcelStatus,
  ParcelStatus
} from './parcel.interface';
import { Parcel } from './parcel.model';

// Status transition rules as defined in SRS
const allowedTransitions: Record<ParcelStatus, ParcelStatus[]> = {
  [ParcelStatus.REQUESTED]: [ParcelStatus.APPROVED, ParcelStatus.CANCELLED],
  [ParcelStatus.APPROVED]: [ParcelStatus.PICKED_UP, ParcelStatus.CANCELLED],
  [ParcelStatus.PICKED_UP]: [ParcelStatus.IN_TRANSIT, ParcelStatus.RETURNED],
  [ParcelStatus.IN_TRANSIT]: [ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.FAILED_DELIVERY],
  [ParcelStatus.OUT_FOR_DELIVERY]: [ParcelStatus.DELIVERED, ParcelStatus.FAILED_DELIVERY],
  [ParcelStatus.DELIVERED]: [], // Terminal state
  [ParcelStatus.CANCELLED]: [], // Terminal state
  [ParcelStatus.RETURNED]: [ParcelStatus.REQUESTED], // Can be re-requested
  [ParcelStatus.FAILED_DELIVERY]: [ParcelStatus.OUT_FOR_DELIVERY, ParcelStatus.RETURNED]
};

// Create a new parcel (Sender only)
const createParcel = async (senderId: string, parcelData: ICreateParcel): Promise<IParcel> => {
  // Verify sender exists and has sender role
  const sender = await User.findById(senderId);
  if (!sender) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Sender not found');
  }
  
  if (sender.role !== 'sender') {
    throw new AppError(StatusCodes.FORBIDDEN, 'Only users with sender role can create parcels');
  }
  
  if (sender.isBlocked) {
    throw new AppError(StatusCodes.FORBIDDEN, 'Your account is blocked');
  }

  // Validate fee calculation input
  const feeValidation = validateFeeCalculationInput(parcelData.parcelDetails, parcelData.deliveryInfo);
  if (!feeValidation.isValid) {
    throw new AppError(StatusCodes.BAD_REQUEST, feeValidation.errors.join(', '));
  }

  // Calculate pricing
  const pricing = calculateParcelFee({
    parcelDetails: parcelData.parcelDetails,
    deliveryInfo: parcelData.deliveryInfo,
  });

  // Generate unique tracking ID
  let trackingId = generateTrackingId();
  let isUnique = false;
  let attempts = 0;
  
  while (!isUnique && attempts < 10) {
    const existingParcel = await Parcel.findOne({ trackingId });
    if (!existingParcel) {
      isUnique = true;
    } else {
      trackingId = generateTrackingId();
    }
    attempts++;
  }
  
  if (!isUnique) {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate unique tracking ID');
  }

  // Create parcel
  const newParcel = await Parcel.create({
    trackingId,
    sender: senderId,
    receiver: parcelData.receiver,
    parcelDetails: parcelData.parcelDetails,
    deliveryInfo: parcelData.deliveryInfo,
    pricing,
    currentStatus: ParcelStatus.REQUESTED,
  });

  return await Parcel.findById(newParcel._id).populate('sender', 'name email phone') as IParcel;
};

// Get parcel by ID (Owner or Admin only)
const getParcelById = async (parcelId: string, userId: string, userRole: string): Promise<IParcel> => {
  const parcel = await Parcel.findById(parcelId).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  // Check access permissions
  const isSender = parcel.sender.toString() === userId;
  const isReceiver = parcel.receiver.email === (await User.findById(userId))?.email;
  const isAdmin = userRole === 'admin';

  if (!isSender && !isReceiver && !isAdmin) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You do not have permission to view this parcel');
  }

  return parcel;
};

// Track parcel by tracking ID (Public)
const trackParcelByTrackingId = async (trackingId: string): Promise<IParcel> => {
  const parcel = await Parcel.findOne({ trackingId }).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found with this tracking ID');
  }

  return parcel;
};

// Get all parcels with filters (Admin only)
const getAllParcels = async (query: Record<string, string>): Promise<{ parcels: IParcel[]; meta: { page: number; limit: number; totalPage: number; total: number } }> => {
  const searchableFields = ['trackingId', 'receiver.name', 'receiver.email', 'parcelDetails.description'];
  
  const parcelQuery = new QueryBuilder(
    Parcel.find().populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone'),
    query
  )
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const parcels = await parcelQuery.build() as IParcel[];
  const meta = await parcelQuery.getMeta();

  return { parcels, meta };
};

// Get sender's parcels
const getSenderParcels = async (senderId: string, query: Record<string, string>): Promise<{ parcels: IParcel[]; meta: { page: number; limit: number; totalPage: number; total: number } }> => {
  const searchableFields = ['trackingId', 'receiver.name', 'receiver.email', 'parcelDetails.description'];
  
  const parcelQuery = new QueryBuilder(
    Parcel.find({ sender: senderId }).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone'),
    query
  )
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const parcels = await parcelQuery.build() as IParcel[];
  const meta = await parcelQuery.getMeta();

  return { parcels, meta };
};

// Get receiver's parcels
const getReceiverParcels = async (receiverEmail: string, query: Record<string, string>): Promise<{ parcels: IParcel[]; meta: { page: number; limit: number; totalPage: number; total: number } }> => {
  const searchableFields = ['trackingId', 'parcelDetails.description'];
  
  const parcelQuery = new QueryBuilder(
    Parcel.find({ 'receiver.email': receiverEmail }).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone'),
    query
  )
    .search(searchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const parcels = await parcelQuery.build() as IParcel[];
  const meta = await parcelQuery.getMeta();

  return { parcels, meta };
};

// Update parcel details (Sender only, before dispatch)
const updateParcel = async (parcelId: string, senderId: string, updateData: IUpdateParcel): Promise<IParcel> => {
  const parcel = await Parcel.findById(parcelId);
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  // Check if user is the sender
  if (parcel.sender.toString() !== senderId) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You can only update your own parcels');
  }

  // Check if parcel can be updated (only before dispatch)
  if (![ParcelStatus.REQUESTED, ParcelStatus.APPROVED].includes(parcel.currentStatus)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update parcel after it has been dispatched');
  }

  if (parcel.isBlocked) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update blocked parcel');
  }

  if (parcel.isCancelled) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update cancelled parcel');
  }

  // Recalculate pricing if parcel details or delivery info changed
  let newPricing = parcel.pricing;
  if (updateData.parcelDetails || updateData.deliveryInfo) {
    const updatedParcelDetails = { ...parcel.parcelDetails, ...updateData.parcelDetails };
    const updatedDeliveryInfo = { ...parcel.deliveryInfo, ...updateData.deliveryInfo };
    
    const feeValidation = validateFeeCalculationInput(updatedParcelDetails, updatedDeliveryInfo);
    if (!feeValidation.isValid) {
      throw new AppError(StatusCodes.BAD_REQUEST, feeValidation.errors.join(', '));
    }

    newPricing = calculateParcelFee({
      parcelDetails: updatedParcelDetails,
      deliveryInfo: updatedDeliveryInfo,
      discount: parcel.pricing.discount,
      couponCode: parcel.pricing.couponCode,
    });
  }

  const updatedParcel = await Parcel.findByIdAndUpdate(
    parcelId,
    {
      ...updateData,
      pricing: newPricing,
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');

  return updatedParcel as IParcel;
};

// Update parcel status (Admin only)
const updateParcelStatus = async (parcelId: string, adminId: string, statusUpdate: IUpdateParcelStatus): Promise<IParcel> => {
  const parcel = await Parcel.findById(parcelId);
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  if (parcel.isBlocked) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update status of blocked parcel');
  }

  // Validate status transition
  const allowedNextStatuses = allowedTransitions[parcel.currentStatus];
  if (!allowedNextStatuses.includes(statusUpdate.status)) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Cannot transition from ${parcel.currentStatus} to ${statusUpdate.status}`
    );
  }

  // Add status log entry
  const statusLogEntry = {
    status: statusUpdate.status,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(adminId),
    location: statusUpdate.location,
    note: statusUpdate.note,
  };

  const updatedParcel = await Parcel.findByIdAndUpdate(
    parcelId,
    {
      currentStatus: statusUpdate.status,
      $push: { statusHistory: statusLogEntry },
      updatedAt: new Date(),
      ...(statusUpdate.status === ParcelStatus.CANCELLED && { isCancelled: true }),
    },
    { new: true, runValidators: true }
  ).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');

  return updatedParcel as IParcel;
};

// Cancel parcel (Sender only, if not dispatched)
const cancelParcel = async (parcelId: string, senderId: string, reason?: string): Promise<IParcel> => {
  const parcel = await Parcel.findById(parcelId);
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  // Check if user is the sender
  if (parcel.sender.toString() !== senderId) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You can only cancel your own parcels');
  }

  // Check if parcel can be cancelled
  if (![ParcelStatus.REQUESTED, ParcelStatus.APPROVED].includes(parcel.currentStatus)) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot cancel parcel after it has been dispatched');
  }

  if (parcel.isCancelled) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Parcel is already cancelled');
  }

  // Add cancellation status log
  const statusLogEntry = {
    status: ParcelStatus.CANCELLED,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(senderId),
    note: reason || 'Cancelled by sender',
  };

  const updatedParcel = await Parcel.findByIdAndUpdate(
    parcelId,
    {
      currentStatus: ParcelStatus.CANCELLED,
      isCancelled: true,
      $push: { statusHistory: statusLogEntry },
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');

  return updatedParcel as IParcel;
};

// Confirm delivery (Receiver only)
const confirmDelivery = async (parcelId: string, receiverEmail: string, note?: string): Promise<IParcel> => {
  const parcel = await Parcel.findById(parcelId);
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  // Check if user is the receiver
  if (parcel.receiver.email !== receiverEmail) {
    throw new AppError(StatusCodes.FORBIDDEN, 'You can only confirm delivery for parcels addressed to you');
  }

  if (parcel.currentStatus !== ParcelStatus.OUT_FOR_DELIVERY) {
    throw new AppError(StatusCodes.BAD_REQUEST, 'Parcel must be out for delivery to confirm delivery');
  }

  // Add delivery confirmation status log
  const statusLogEntry = {
    status: ParcelStatus.DELIVERED,
    timestamp: new Date(),
    updatedBy: parcel.receiver.email, // Use email since receiver might not be a registered user
    note: note || 'Delivery confirmed by receiver',
  };

  const updatedParcel = await Parcel.findByIdAndUpdate(
    parcelId,
    {
      currentStatus: ParcelStatus.DELIVERED,
      $push: { statusHistory: statusLogEntry },
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');

  return updatedParcel as IParcel;
};

// Block/unblock parcel (Admin only)
const blockParcel = async (parcelId: string, adminId: string, isBlocked: boolean, reason?: string): Promise<IParcel> => {
  const parcel = await Parcel.findById(parcelId);
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  const action = isBlocked ? 'blocked' : 'unblocked';
  const statusLogEntry = {
    status: parcel.currentStatus,
    timestamp: new Date(),
    updatedBy: new Types.ObjectId(adminId),
    note: `Parcel ${action} by admin${reason ? `: ${reason}` : ''}`,
  };

  const updatedParcel = await Parcel.findByIdAndUpdate(
    parcelId,
    {
      isBlocked,
      $push: { statusHistory: statusLogEntry },
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');

  return updatedParcel as IParcel;
};

// Assign delivery personnel (Admin only)
const assignDeliveryPersonnel = async (parcelId: string, deliveryPersonnelId: string): Promise<IParcel> => {
  const parcel = await Parcel.findById(parcelId);
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  // Verify delivery personnel exists
  const deliveryPersonnel = await User.findById(deliveryPersonnelId);
  if (!deliveryPersonnel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Delivery personnel not found');
  }

  const updatedParcel = await Parcel.findByIdAndUpdate(
    parcelId,
    {
      deliveryPersonnel: deliveryPersonnelId,
      updatedAt: new Date(),
    },
    { new: true, runValidators: true }
  ).populate('sender', 'name email phone').populate('deliveryPersonnel', 'name email phone');

  return updatedParcel as IParcel;
};

// Delete parcel (Admin only)
const deleteParcel = async (parcelId: string): Promise<void> => {
  const parcel = await Parcel.findById(parcelId);
  
  if (!parcel) {
    throw new AppError(StatusCodes.NOT_FOUND, 'Parcel not found');
  }

  await Parcel.findByIdAndDelete(parcelId);
};

// Get parcel statistics (Admin only)
const getParcelStats = async (): Promise<{
  overview: {
    statusBreakdown: { status: string; count: number; totalValue: number }[];
    totalParcels: number;
    totalRevenue: number;
  };
  urgencyBreakdown: { _id: string; count: number }[];
}> => {
  const stats = await Parcel.aggregate([
    {
      $group: {
        _id: '$currentStatus',
        count: { $sum: 1 },
        totalValue: { $sum: '$pricing.totalFee' },
      },
    },
    {
      $group: {
        _id: null,
        statusBreakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            totalValue: '$totalValue',
          },
        },
        totalParcels: { $sum: '$count' },
        totalRevenue: { $sum: '$totalValue' },
      },
    },
  ]);

  const urgencyStats = await Parcel.aggregate([
    {
      $group: {
        _id: '$deliveryInfo.urgency',
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    overview: stats[0] || { statusBreakdown: [], totalParcels: 0, totalRevenue: 0 },
    urgencyBreakdown: urgencyStats,
  };
};

export const ParcelService = {
  createParcel,
  getParcelById,
  trackParcelByTrackingId,
  getAllParcels,
  getSenderParcels,
  getReceiverParcels,
  updateParcel,
  updateParcelStatus,
  cancelParcel,
  confirmDelivery,
  blockParcel,
  assignDeliveryPersonnel,
  deleteParcel,
  getParcelStats,
}; 
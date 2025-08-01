import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ParcelService } from "./parcel.service";

// Create new parcel (Sender only)
const createParcel = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user?.userId;
  const parcelData = req.body;

  if (!senderId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.createParcel(senderId, parcelData);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Parcel created successfully",
    data: result,
  });
});

// Get parcel by ID (Owner or Admin only)
const getParcelById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  if (!userId || !userRole) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.getParcelById(id, userId, userRole);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcel retrieved successfully",
    data: result,
  });
});

// Track parcel by tracking ID (Public)
const trackParcel = catchAsync(async (req: Request, res: Response) => {
  const { trackingId } = req.params;

  const result = await ParcelService.trackParcelByTrackingId(trackingId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcel tracked successfully",
    data: result,
  });
});

// Get all parcels with filters (Admin only)
const getAllParcels = catchAsync(async (req: Request, res: Response) => {
  const result = await ParcelService.getAllParcels(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcels retrieved successfully",
    data: result.parcels,
    meta: result.meta,
  });
});

// Get sender's parcels (Sender only)
const getMySentParcels = catchAsync(async (req: Request, res: Response) => {
  const senderId = req.user?.userId;

  if (!senderId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.getSenderParcels(
    senderId,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Sent parcels retrieved successfully",
    data: result.parcels,
    meta: result.meta,
  });
});

// Get receiver's parcels (Receiver only)
const getMyReceivedParcels = catchAsync(async (req: Request, res: Response) => {
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.getReceiverParcels(
    userEmail,
    req.query as Record<string, string>
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Received parcels retrieved successfully",
    data: result.parcels,
    meta: result.meta,
  });
});

// Update parcel details (Sender only, before dispatch)
const updateParcel = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const senderId = req.user?.userId;
  const updateData = req.body;

  if (!senderId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.updateParcel(id, senderId, updateData);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcel updated successfully",
    data: result,
  });
});

// Update parcel status (Admin only)
const updateParcelStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.userId;
  const statusUpdate = req.body;

  if (!adminId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.updateParcelStatus(
    id,
    adminId,
    statusUpdate
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcel status updated successfully",
    data: result,
  });
});

// Cancel parcel (Sender only, if not dispatched)
const cancelParcel = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const senderId = req.user?.userId;
  const { reason } = req.body;

  if (!senderId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.cancelParcel(id, senderId, reason);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcel cancelled successfully",
    data: result,
  });
});

// Confirm delivery (Receiver only)
const confirmDelivery = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const receiverEmail = req.user?.email;
  const { note } = req.body;

  if (!receiverEmail) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.confirmDelivery(id, receiverEmail, note);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Delivery confirmed successfully",
    data: result,
  });
});

// Block/unblock parcel (Admin only)
const blockParcel = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const adminId = req.user?.userId;
  const { isBlocked, reason } = req.body;

  if (!adminId) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  const result = await ParcelService.blockParcel(
    id,
    adminId,
    isBlocked,
    reason
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Parcel ${isBlocked ? "blocked" : "unblocked"} successfully`,
    data: result,
  });
});

// Assign delivery personnel (Admin only)
const assignDeliveryPersonnel = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { deliveryPersonnelId } = req.body;

    const result = await ParcelService.assignDeliveryPersonnel(
      id,
      deliveryPersonnelId
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Delivery personnel assigned successfully",
      data: result,
    });
  }
);

// Delete parcel (Admin only)
const deleteParcel = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await ParcelService.deleteParcel(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcel deleted successfully",
    data: null,
  });
});

// Get parcel statistics (Admin only)
const getParcelStats = catchAsync(async (req: Request, res: Response) => {
  const result = await ParcelService.getParcelStats();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Parcel statistics retrieved successfully",
    data: result,
  });
});

// Get parcel status history (Owner or Admin only)
const getParcelStatusHistory = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
    }

    const parcel = await ParcelService.getParcelById(id, userId, userRole);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Parcel status history retrieved successfully",
      data: parcel.statusHistory,
    });
  }
);

// Get delivery history for receiver
const getDeliveryHistory = catchAsync(async (req: Request, res: Response) => {
  const receiverEmail = req.user?.email;

  if (!receiverEmail) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  // Filter for delivered parcels only
  const queryWithDeliveredFilter = {
    ...req.query,
    status: "delivered",
  } as Record<string, string>;

  const result = await ParcelService.getReceiverParcels(
    receiverEmail,
    queryWithDeliveredFilter
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Delivery history retrieved successfully",
    data: result.parcels,
    meta: result.meta,
  });
});

export const ParcelController = {
  createParcel,
  getParcelById,
  trackParcel,
  getAllParcels,
  getMySentParcels,
  getMyReceivedParcels,
  updateParcel,
  updateParcelStatus,
  cancelParcel,
  confirmDelivery,
  blockParcel,
  assignDeliveryPersonnel,
  deleteParcel,
  getParcelStats,
  getParcelStatusHistory,
  getDeliveryHistory,
};

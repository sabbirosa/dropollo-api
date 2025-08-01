import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { ParcelController } from "./parcel.controller";
import {
  assignDeliveryPersonnelValidation,
  blockParcelValidation,
  confirmDeliveryValidation,
  createParcelValidation,
  getParcelQueryValidation,
  parcelIdValidation,
  trackParcelValidation,
  updateParcelStatusValidation,
  updateParcelValidation,
} from "./parcel.validation";

const router = Router();

// Public Routes
router.get(
  "/track/:trackingId",
  validateRequest(trackParcelValidation),
  ParcelController.trackParcel
);

// Sender Routes
router.post(
  "/",
  checkAuth("sender"),
  validateRequest(createParcelValidation),
  ParcelController.createParcel
);

router.get(
  "/my-sent",
  checkAuth("sender"),
  validateRequest(getParcelQueryValidation),
  ParcelController.getMySentParcels
);

router.put(
  "/:id",
  checkAuth("sender"),
  validateRequest(parcelIdValidation),
  validateRequest(updateParcelValidation),
  ParcelController.updateParcel
);

router.delete(
  "/:id/cancel",
  checkAuth("sender"),
  validateRequest(parcelIdValidation),
  ParcelController.cancelParcel
);

// Receiver Routes
router.get(
  "/my-received",
  checkAuth("receiver"),
  validateRequest(getParcelQueryValidation),
  ParcelController.getMyReceivedParcels
);

router.put(
  "/:id/confirm-delivery",
  checkAuth("receiver"),
  validateRequest(parcelIdValidation),
  validateRequest(confirmDeliveryValidation),
  ParcelController.confirmDelivery
);

router.get(
  "/delivery-history",
  checkAuth("receiver"),
  validateRequest(getParcelQueryValidation),
  ParcelController.getDeliveryHistory
);

// Admin Routes
router.get(
  "/",
  checkAuth("admin"),
  validateRequest(getParcelQueryValidation),
  ParcelController.getAllParcels
);

router.put(
  "/:id/status",
  checkAuth("admin"),
  validateRequest(parcelIdValidation),
  validateRequest(updateParcelStatusValidation),
  ParcelController.updateParcelStatus
);

router.put(
  "/:id/block",
  checkAuth("admin"),
  validateRequest(parcelIdValidation),
  validateRequest(blockParcelValidation),
  ParcelController.blockParcel
);

router.put(
  "/:id/assign",
  checkAuth("admin"),
  validateRequest(parcelIdValidation),
  validateRequest(assignDeliveryPersonnelValidation),
  ParcelController.assignDeliveryPersonnel
);

router.get("/stats", checkAuth("admin"), ParcelController.getParcelStats);

router.delete(
  "/:id",
  checkAuth("admin"),
  validateRequest(parcelIdValidation),
  ParcelController.deleteParcel
);

// Shared Routes (Role-based access)
router.get(
  "/:id",
  checkAuth("admin", "sender", "receiver"),
  validateRequest(parcelIdValidation),
  ParcelController.getParcelById
);

router.get(
  "/:id/status-history",
  checkAuth("admin", "sender", "receiver"),
  validateRequest(parcelIdValidation),
  ParcelController.getParcelStatusHistory
);

export const ParcelRoutes = router;

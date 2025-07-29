import { IDeliveryInfo, IParcelDetails, IPricing } from '../modules/parcel/parcel.interface';

interface IFeeCalculationInput {
  parcelDetails: IParcelDetails;
  deliveryInfo: IDeliveryInfo;
  discount?: number;
  couponCode?: string;
}

/**
 * Calculate parcel delivery fees based on weight, urgency, and other factors
 * @param input - Object containing parcel details and delivery information
 * @returns Calculated pricing breakdown
 */
export const calculateParcelFee = (input: IFeeCalculationInput): IPricing => {
  const { parcelDetails, deliveryInfo, discount = 0, couponCode } = input;
  
  // Base delivery fee
  const baseFee = 50;
  
  // Weight-based fee (per kg)
  const weightFee = parcelDetails.weight * 10;
  
  // Urgency multipliers
  const urgencyMultiplier = {
    standard: 1,
    express: 1.5,
    urgent: 2
  };
  
  // Calculate urgency fee
  const urgencyFee = baseFee * (urgencyMultiplier[deliveryInfo.urgency] - 1);
  
  // Calculate subtotal
  const subtotal = baseFee + weightFee + urgencyFee;
  
  // Apply discount
  const totalFee = Math.max(0, subtotal - discount);
  
  return {
    baseFee,
    weightFee,
    urgencyFee,
    totalFee,
    discount: discount > 0 ? discount : undefined,
    couponCode: couponCode || undefined
  };
};

/**
 * Validate fee calculation parameters
 * @param parcelDetails - Parcel details containing weight
 * @param deliveryInfo - Delivery information containing urgency
 * @returns boolean indicating if parameters are valid for fee calculation
 */
export const validateFeeCalculationInput = (
  parcelDetails: IParcelDetails,
  deliveryInfo: IDeliveryInfo
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!parcelDetails.weight || parcelDetails.weight <= 0) {
    errors.push('Weight must be greater than 0');
  }
  
  if (parcelDetails.weight > 50) {
    errors.push('Weight cannot exceed 50kg');
  }
  
  if (!['standard', 'express', 'urgent'].includes(deliveryInfo.urgency)) {
    errors.push('Invalid urgency level');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}; 
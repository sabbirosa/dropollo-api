/**
 * Generate a unique tracking ID in the format: TRK-YYYYMMDD-XXXXXX
 * @returns A unique tracking ID string
 */
export const generateTrackingId = (): string => {
  // Get current date in YYYYMMDD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate 6-digit random number
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  
  return `TRK-${dateString}-${randomNumber}`;
};

/**
 * Validate tracking ID format
 * @param trackingId - The tracking ID to validate
 * @returns boolean indicating if the format is valid
 */
export const isValidTrackingId = (trackingId: string): boolean => {
  const trackingRegex = /^TRK-\d{8}-\d{6}$/;
  return trackingRegex.test(trackingId);
}; 
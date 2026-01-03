/**
 * Phone Number Normalization Utility
 * Handles Indian phone number formatting and normalization
 */

/**
 * Normalizes phone number to 10-digit format (removes +91, 91, spaces)
 * @param {string} phone - Phone number in any format
 * @returns {string|null} - 10-digit phone number or null if invalid
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  
  // Convert to string in case it's a number
  const phoneStr = String(phone).trim();
  if (!phoneStr) return null;
  
  // Remove all non-digit characters first
  let cleaned = phoneStr.replace(/\D/g, '');
  
  // If no digits found, return null
  if (!cleaned || cleaned.length === 0) return null;
  
  // Remove leading 0 if present (11-digit numbers: 0XXXXXXXXXX -> XXXXXXXXXX)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }
  
  // Remove leading 91 if present (India country code, 12-digit numbers: 91XXXXXXXXXX -> XXXXXXXXXX)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }
  
  // Return 10-digit number
  return cleaned.length === 10 ? cleaned : null;
};

/**
 * Formats phone number to +91 format for storage
 * @param {string} phone - Phone number in any format
 * @returns {string|null} - Formatted phone number as +91XXXXXXXXXX or null if invalid
 */
const formatPhoneForStorage = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized ? `+91${normalized}` : null;
};

/**
 * Validates if phone number is a valid 10-digit Indian mobile number
 * @param {string} phone - Phone number in any format
 * @returns {boolean} - True if valid
 */
const isValidIndianPhone = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;
  
  // Indian mobile numbers start with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(normalized);
};

/**
 * Gets 10-digit phone number from stored format (+91XXXXXXXXXX)
 * @param {string} storedPhone - Phone number in +91 format
 * @returns {string|null} - 10-digit phone number or null
 */
const get10DigitPhone = (storedPhone) => {
  if (!storedPhone) return null;
  return normalizePhone(storedPhone);
};

module.exports = {
  normalizePhone,
  formatPhoneForStorage,
  isValidIndianPhone,
  get10DigitPhone,
};


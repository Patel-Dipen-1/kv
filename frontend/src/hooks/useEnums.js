import { useSelector } from "react-redux";
import { getEnumValues, getAllEnums } from "../features/enums/enumSlice";
import * as staticEnums from "../constants/enums";

/**
 * Custom hook to get enum values dynamically
 * Returns dynamic enums from backend if available, otherwise static enums
 * 
 * @param {string} enumType - The enum type to get (e.g., "USER_ROLES", "MARITAL_STATUS")
 * @returns {Array} Array of enum values
 * 
 * @example
 * const roles = useEnums("USER_ROLES");
 * const statuses = useEnums("USER_STATUS");
 */
export const useEnums = (enumType) => {
  const dynamicEnums = useSelector((state) => state.enums?.enums);
  
  // If dynamic enums are available and have this type, use them
  if (dynamicEnums && dynamicEnums[enumType]) {
    return dynamicEnums[enumType];
  }
  
  // Fallback to static enums
  return staticEnums[enumType] || [];
};

/**
 * Custom hook to get all enums
 * @returns {Object} Object with all enum types as keys
 */
export const useAllEnums = () => {
  const dynamicEnums = useSelector((state) => state.enums?.enums);
  
  if (dynamicEnums) {
    return dynamicEnums;
  }
  
  // Fallback to static enums
  return staticEnums;
};

/**
 * Helper function to convert enum array to options format
 * @param {Array} enumArray - Array of enum values
 * @returns {Array} Array of {value, label} objects
 */
export const enumToOptions = (enumArray) => {
  return enumArray.map((value) => ({
    value,
    label: value,
  }));
};


const Enum = require("../models/enumModel");

/**
 * Get enum values from database, fallback to constants file
 * This allows dynamic enum management while keeping code constants as fallback
 */
const getEnumValues = async (enumType) => {
  try {
    const enumItem = await Enum.findOne({ enumType, isActive: true });
    if (enumItem && enumItem.values && enumItem.values.length > 0) {
      return enumItem.values;
    }
  } catch (error) {
    console.error(`Error fetching ${enumType} from database:`, error);
  }

  // Fallback to constants file
  const enums = require("../constants/enums");
  return enums[enumType] || [];
};

/**
 * Get all enum values (for models that need them)
 */
const getAllEnumValues = async () => {
  try {
    const dbEnums = await Enum.find({ isActive: true });
    const enumMap = {};
    
    dbEnums.forEach((enumItem) => {
      enumMap[enumItem.enumType] = enumItem.values;
    });

    // Merge with constants file (database takes precedence)
    const constants = require("../constants/enums");
    Object.keys(constants).forEach((key) => {
      if (!enumMap[key]) {
        enumMap[key] = constants[key];
      }
    });

    return enumMap;
  } catch (error) {
    console.error("Error fetching enums from database:", error);
    // Fallback to constants only
    return require("../constants/enums");
  }
};

module.exports = {
  getEnumValues,
  getAllEnumValues,
};


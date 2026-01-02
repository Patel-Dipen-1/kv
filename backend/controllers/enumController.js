const Enum = require("../models/enumModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Get all enum types and their values
 * GET /api/admin/enums
 */
exports.getAllEnums = catchAsyncErrors(async (req, res, next) => {
  const enums = await Enum.find({ isActive: true }).sort({ enumType: 1 });

  // Format response
  const enumMap = {};
  enums.forEach((enumItem) => {
    enumMap[enumItem.enumType] = enumItem.values;
  });

  res.status(200).json({
    success: true,
    data: enumMap,
    enums: enums,
  });
});

/**
 * Get single enum type
 * GET /api/admin/enums/:enumType
 */
exports.getEnumByType = catchAsyncErrors(async (req, res, next) => {
  const { enumType } = req.params;

  const enumItem = await Enum.findOne({ enumType, isActive: true });

  if (!enumItem) {
    return next(new ErrorHandler(`Enum type ${enumType} not found`, 404));
  }

  res.status(200).json({
    success: true,
    data: enumItem,
  });
});

/**
 * Create or update enum values
 * POST /api/admin/enums
 */
exports.createOrUpdateEnum = catchAsyncErrors(async (req, res, next) => {
  const { enumType, values, description } = req.body;

  if (!enumType || !values || !Array.isArray(values) || values.length === 0) {
    return next(
      new ErrorHandler("Enum type and values array are required", 400)
    );
  }

  // Validate enum type
  const validEnumTypes = [
    "USER_ROLES",
    "USER_STATUS",
    "COMMITTEE_POSITIONS",
    "MARITAL_STATUS",
    "OCCUPATION_TYPES",
    "RELATIONSHIP_TYPES",
    "SAMAJ_TYPES",
    "COUNTRIES",
  ];

  if (!validEnumTypes.includes(enumType)) {
    return next(new ErrorHandler(`Invalid enum type: ${enumType}`, 400));
  }

  // Check if enum exists
  let enumItem = await Enum.findOne({ enumType });

  if (enumItem) {
    // Update existing
    enumItem.values = values;
    if (description) enumItem.description = description;
    await enumItem.save();
  } else {
    // Create new
    enumItem = await Enum.create({
      enumType,
      values,
      description,
    });
  }

  res.status(200).json({
    success: true,
    message: `Enum ${enumType} updated successfully`,
    data: enumItem,
  });
});

/**
 * Add value to enum
 * PATCH /api/admin/enums/:enumType/add-value
 */
exports.addEnumValue = catchAsyncErrors(async (req, res, next) => {
  const { enumType } = req.params;
  const { value } = req.body;

  if (!value || typeof value !== "string" || value.trim().length === 0) {
    return next(new ErrorHandler("Value is required and must be a string", 400));
  }

  const enumItem = await Enum.findOne({ enumType, isActive: true });

  if (!enumItem) {
    return next(new ErrorHandler(`Enum type ${enumType} not found`, 404));
  }

  // Check if value already exists
  if (enumItem.values.includes(value.trim())) {
    return next(new ErrorHandler(`Value "${value}" already exists in ${enumType}`, 409));
  }

  // Add value
  enumItem.values.push(value.trim());
  await enumItem.save();

  res.status(200).json({
    success: true,
    message: `Value "${value}" added to ${enumType} successfully`,
    data: enumItem,
  });
});

/**
 * Remove value from enum
 * PATCH /api/admin/enums/:enumType/remove-value
 */
exports.removeEnumValue = catchAsyncErrors(async (req, res, next) => {
  const { enumType } = req.params;
  const { value } = req.body;

  if (!value) {
    return next(new ErrorHandler("Value is required", 400));
  }

  const enumItem = await Enum.findOne({ enumType, isActive: true });

  if (!enumItem) {
    return next(new ErrorHandler(`Enum type ${enumType} not found`, 404));
  }

  // Check if value exists
  if (!enumItem.values.includes(value)) {
    return next(new ErrorHandler(`Value "${value}" not found in ${enumType}`, 404));
  }

  // Prevent removing if it's the last value
  if (enumItem.values.length === 1) {
    return next(
      new ErrorHandler(
        `Cannot remove the last value from ${enumType}. Enum must have at least one value.`,
        400
      )
    );
  }

  // Remove value
  enumItem.values = enumItem.values.filter((v) => v !== value);
  await enumItem.save();

  res.status(200).json({
    success: true,
    message: `Value "${value}" removed from ${enumType} successfully`,
    data: enumItem,
  });
});

/**
 * Initialize enums from constants file (one-time setup)
 * POST /api/admin/enums/initialize
 */
exports.initializeEnums = catchAsyncErrors(async (req, res, next) => {
  const {
    USER_ROLES,
    USER_STATUS,
    COMMITTEE_POSITIONS,
    MARITAL_STATUS,
    OCCUPATION_TYPES,
    RELATIONSHIP_TYPES,
    SAMAJ_TYPES,
    COUNTRIES,
  } = require("../constants/enums");

  const enumData = [
    { enumType: "USER_ROLES", values: USER_ROLES },
    { enumType: "USER_STATUS", values: USER_STATUS },
    { enumType: "COMMITTEE_POSITIONS", values: COMMITTEE_POSITIONS },
    { enumType: "MARITAL_STATUS", values: MARITAL_STATUS },
    { enumType: "OCCUPATION_TYPES", values: OCCUPATION_TYPES },
    { enumType: "RELATIONSHIP_TYPES", values: RELATIONSHIP_TYPES },
    { enumType: "SAMAJ_TYPES", values: SAMAJ_TYPES },
    { enumType: "COUNTRIES", values: COUNTRIES },
  ];

  const results = [];

  for (const item of enumData) {
    let enumItem = await Enum.findOne({ enumType: item.enumType });
    if (enumItem) {
      enumItem.values = item.values;
      await enumItem.save();
    } else {
      enumItem = await Enum.create(item);
    }
    results.push(enumItem);
  }

  res.status(200).json({
    success: true,
    message: "All enums initialized successfully",
    data: results,
  });
});


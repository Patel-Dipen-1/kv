const ActivityLog = require("../models/activityLogModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Get activity logs (Admin only)
 * GET /api/admin/activity-logs
 */
exports.getActivityLogs = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  const { actionType, targetUser, performedBy, startDate, endDate } = req.query;

  // Build filter
  const filter = {};
  if (actionType) filter.actionType = actionType;
  if (targetUser) filter.targetUser = targetUser;
  if (performedBy) filter.performedBy = performedBy;

  // Date range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.createdAt.$lte = new Date(endDate);
    }
  }

  const total = await ActivityLog.countDocuments(filter);

  const logs = await ActivityLog.find(filter)
    .populate("performedBy", "firstName lastName email role")
    .populate("targetUser", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select("-__v");

  res.status(200).json({
    success: true,
    count: logs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: logs,
  });
});

/**
 * Get activity log by ID (Admin only)
 * GET /api/admin/activity-logs/:id
 */
exports.getActivityLogById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const log = await ActivityLog.findById(id)
    .populate("performedBy", "firstName lastName email role")
    .populate("targetUser", "firstName lastName email")
    .populate("targetFamilyMember", "firstName lastName relationshipToUser");

  if (!log) {
    return next(new ErrorHandler("Activity log not found", 404));
  }

  res.status(200).json({
    success: true,
    data: log,
  });
});


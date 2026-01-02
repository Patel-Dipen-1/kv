const ActivityLog = require("../models/activityLogModel");

/**
 * Log an activity
 * @param {Object} options - Activity log options
 * @param {String} options.performedBy - User ID who performed the action
 * @param {String} options.actionType - Type of action
 * @param {String} options.targetUser - Target user ID (optional)
 * @param {String} options.targetFamilyMember - Target family member ID (optional)
 * @param {Object} options.details - Additional details (optional)
 * @param {String} options.description - Human-readable description
 * @param {String} options.ipAddress - IP address (optional)
 */
const logActivity = async ({
  performedBy,
  actionType,
  targetUser = null,
  targetFamilyMember = null,
  details = {},
  description,
  ipAddress = null,
}) => {
  try {
    await ActivityLog.create({
      performedBy,
      actionType,
      targetUser,
      targetFamilyMember,
      details,
      description,
      ipAddress,
    });
  } catch (error) {
    // Don't throw error - logging should not break the main flow
    console.error("Error logging activity:", error);
  }
};

module.exports = { logActivity };


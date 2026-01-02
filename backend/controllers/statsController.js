const User = require("../models/userModel");
const FamilyMember = require("../models/familyMemberModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Get comprehensive user statistics (Admin only)
 * GET /api/admin/stats
 */
exports.getUserStats = catchAsyncErrors(async (req, res, next) => {
  // User counts by status
  const pendingCount = await User.countDocuments({ status: "pending" });
  const approvedCount = await User.countDocuments({ status: "approved" });
  const rejectedCount = await User.countDocuments({ status: "rejected" });
  const totalUsers = await User.countDocuments({});

  // User counts by role
  const userRoleCount = await User.countDocuments({ role: "user" });
  const committeeCount = await User.countDocuments({ role: "committee", status: "approved", isActive: true });
  const moderatorCount = await User.countDocuments({ role: "moderator" });
  const adminCount = await User.countDocuments({ role: "admin" });

  // Family member statistics
  const totalFamilyMembers = await FamilyMember.countDocuments({ approvalStatus: "approved", isActive: true });
  const pendingFamilyMembers = await FamilyMember.countDocuments({ approvalStatus: "pending" });
  const totalFamilies = await User.distinct("subFamilyNumber").then(ids => ids.length);

  // Active vs inactive users
  const activeUsers = await User.countDocuments({ isActive: true });
  const inactiveUsers = await User.countDocuments({ isActive: false });

  // Recent registrations (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentRegistrations = await User.countDocuments({
    createdAt: { $gte: sevenDaysAgo },
  });

  res.status(200).json({
    success: true,
    stats: {
      // Status counts
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: totalUsers,
      
      // Role counts
      users: userRoleCount,
      committee: committeeCount,
      moderators: moderatorCount,
      admins: adminCount,
      
      // Family statistics
      totalFamilyMembers,
      pendingFamilyMembers,
      totalFamilies,
      
      // Activity
      activeUsers,
      inactiveUsers,
      recentRegistrations,
    },
  });
});


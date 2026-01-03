const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorhander");
const User = require("../models/userModel");
const FamilyMember = require("../models/familyMemberModel");
const { logActivity } = require("../utils/activityLogger");

/**
 * Get current logged-in user profile
 * GET /api/users/me
 */
exports.getMe = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("roleRef");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if user is deleted
  if (!user.isActive || user.deletedAt) {
    return next(new ErrorHandler("Your account has been deleted", 403));
  }

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    user: userData,
  });
});

/**
 * Update current user profile
 * PATCH /api/users/me
 */
exports.updateMe = catchAsyncErrors(async (req, res, next) => {
  const {
    address,
    age,
    dateOfBirth,
    occupationTitle,
    companyOrBusinessName,
    position,
    qualification,
    maritalStatus,
    profileImage,
    subFamilyNumber,
  } = req.body;

  // Fields that are allowed to be updated
  const allowedFields = {
    address,
    age,
    dateOfBirth,
    occupationTitle,
    companyOrBusinessName,
    position,
    qualification,
    maritalStatus,
    subFamilyNumber,
  };

  // Handle profileImage separately - can be null to remove, or a new image
  if (profileImage !== undefined) {
    allowedFields.profileImage = profileImage; // Can be null to remove
  }

  // Remove undefined fields (but keep null values for profileImage removal)
  Object.keys(allowedFields).forEach((key) => {
    if (allowedFields[key] === undefined) {
      delete allowedFields[key];
    }
  });

  // Update user
  const user = await User.findByIdAndUpdate(req.user.id, allowedFields, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: userData,
  });
});

/**
 * Update user role and status (Admin only)
 * PATCH /api/users/:id/role
 */
exports.updateRole = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const {
    newRole,
    role,
    status,
    committeePosition,
    committeeDisplayOrder,
    committeeBio,
  } = req.body;

  // Support both newRole and role for backward compatibility
  const roleToSet = newRole || role;

  if (!roleToSet && !status) {
    return next(
      new ErrorHandler("Please provide role or status to update", 400)
    );
  }

  // If role is being changed to "committee", validate committeePosition is provided
  if (roleToSet === "committee" && !committeePosition) {
    return next(
      new ErrorHandler(
        "Committee position is required when assigning committee role",
        400
      )
    );
  }

  // Get old user data for logging
  const oldUser = await User.findById(id);
  if (!oldUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  const updateData = {};
  if (roleToSet) {
    updateData.role = roleToSet;

    // If role is committee, set committee fields
    if (roleToSet === "committee") {
      updateData.committeePosition = committeePosition;
      updateData.committeeDisplayOrder = committeeDisplayOrder || 0;
      updateData.committeeBio = committeeBio || "";
    } else {
      // If role is not committee, clear committee fields
      updateData.committeePosition = undefined;
      updateData.committeeDisplayOrder = 0;
      updateData.committeeBio = undefined;
    }
  }
  if (status) updateData.status = status;

  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  if (status && status !== oldUser.status) {
    // Status change
    await logActivity({
      performedBy: req.user.id,
      actionType: status === "approved" ? "user_approved" : "user_rejected",
      targetUser: id,
      details: {
        oldStatus: oldUser.status,
        newStatus: status,
      },
      description: `User ${oldUser.firstName} ${oldUser.lastName} ${status === "approved" ? "approved" : "rejected"}`,
      ipAddress,
    });
  }

  if (roleToSet && roleToSet !== oldUser.role) {
    // Role change
    const actionType = roleToSet === "committee" ? "committee_assigned" : "role_changed";
    await logActivity({
      performedBy: req.user.id,
      actionType,
      targetUser: id,
      details: {
        oldRole: oldUser.role,
        newRole: roleToSet,
        committeePosition: roleToSet === "committee" ? committeePosition : null,
      },
      description: `User ${oldUser.firstName} ${oldUser.lastName} role changed from ${oldUser.role} to ${roleToSet}${roleToSet === "committee" ? ` (${committeePosition})` : ""}`,
      ipAddress,
    });
  }

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  // If status was changed to approved, get next pending user for auto-redirect
  let nextPendingUser = null;
  if (status && status === "approved" && status !== oldUser.status) {
    nextPendingUser = await User.findOne({
      status: "pending",
      isActive: true,
      deletedAt: null,
    })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: 1 })
      .lean();
  }

  const message =
    roleToSet === "committee"
      ? `User role updated to ${committeePosition} successfully`
      : "User role/status updated successfully";

  res.status(200).json({
    success: true,
    message,
    user: userData,
    nextPendingUser: nextPendingUser || undefined,
  });
});

/**
 * Get committee members (Public endpoint)
 * GET /api/committee-members
 */
exports.getCommitteeMembers = catchAsyncErrors(async (req, res, next) => {
  const committeeMembers = await User.find({
    role: "committee",
    status: "approved",
    isActive: true,
    deletedAt: null,
    isActive: true,
  })
    .select(
      "firstName middleName lastName email mobileNumber profileImage committeePosition committeeBio committeeDisplayOrder"
    )
    .sort({ committeeDisplayOrder: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    data: committeeMembers,
  });
});

/**
 * Approve user (change status to approved)
 * PATCH /api/users/:id/approve
 */
exports.approveUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const oldUser = await User.findById(id);
  if (!oldUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Allow changing from any status to approved (pending → approved, rejected → approved)
  const user = await User.findByIdAndUpdate(
    id,
    { status: "approved" },
    { new: true, runValidators: true }
  );

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "user_approved",
    targetUser: id,
    details: {
      oldStatus: oldUser.status,
      newStatus: "approved",
    },
    description: `User ${oldUser.firstName} ${oldUser.lastName} approved`,
    ipAddress,
  });

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    message: "User approved successfully",
    user: userData,
  });
});

/**
 * Reject user (change status to rejected)
 * PATCH /api/users/:id/reject
 */
exports.rejectUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { rejectionReason } = req.body || {};

  const oldUser = await User.findById(id);
  if (!oldUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Allow changing from any status to rejected (pending → rejected, approved → rejected)
  const user = await User.findByIdAndUpdate(
    id,
    { status: "rejected" },
    { new: true, runValidators: true }
  );

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "user_rejected",
    targetUser: id,
    details: {
      oldStatus: oldUser.status,
      newStatus: "rejected",
      rejectionReason: rejectionReason || "",
    },
    description: `User ${oldUser.firstName} ${oldUser.lastName} rejected${rejectionReason ? `: ${rejectionReason}` : ""}`,
    ipAddress,
  });

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    message: "User rejected successfully",
    user: userData,
  });
});

/**
 * Get all users with pagination and filters (Admin/Moderator only)
 * GET /api/users
 */
exports.getUsers = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    status,
    role,
    subFamilyNumber,
    occupationType,
    maritalStatus,
    search,
  } = req.query;

  // Build filter object
  const filter = {};

  if (status) filter.status = status;
  if (role) filter.role = role;
  if (subFamilyNumber) filter.subFamilyNumber = subFamilyNumber;
  if (occupationType) filter.occupationType = occupationType;
  if (maritalStatus) filter.maritalStatus = maritalStatus;

  // Search by name, email, or mobile number
  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { mobileNumber: { $regex: search, $options: "i" } },
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get users with pagination
  const users = await User.find(filter)
    .select("-password -passwordResetToken -passwordResetExpires")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Get total count
  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    users,
  });
});

/**
 * Get user by ID (Admin/Moderator or self)
 * GET /api/users/:id
 */
exports.getUserById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  // Allow users to view their own profile, or users with canViewUsers permission
  if (id !== req.user.id) {
    // Check if user has canViewUsers permission (set by authorizePermission middleware if route is protected)
    // For now, allow if user has canViewUsers permission from their role
    const User = require("../models/userModel");
    const user = await User.findById(req.user.id).populate("roleRef");
    if (!user || !user.roleRef || !user.roleRef.hasPermission("canViewUsers")) {
      return next(
        new ErrorHandler("You are not authorized to view this user", 403)
      );
    }
  }

  const user = await User.findById(id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if user is deleted (unless admin viewing deleted users)
  const isAdmin = req.user.roleRef?.permissions?.canViewUsers === true;
  if (!isAdmin && (!user.isActive || user.deletedAt)) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    user: userData,
  });
});

/**
 * Change password (Authenticated user)
 * PATCH /api/users/change-password
 */
exports.changePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(
      new ErrorHandler("Current password and new password are required", 400)
    );
  }

  // Validate new password
  if (newPassword.length < 8) {
    return next(
      new ErrorHandler("New password must be at least 8 characters", 400)
    );
  }

  if (!/^(?=.*[A-Za-z])(?=.*\d)/.test(newPassword)) {
    return next(
      new ErrorHandler(
        "New password must contain at least one letter and one number",
        400
      )
    );
  }

  // Get user with password field
  const user = await User.findById(req.user.id).select("+password");

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Verify current password
  const isPasswordMatched = await user.comparePassword(currentPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Current password is incorrect", 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "password_changed",
    targetUser: req.user.id,
    details: {},
    description: "Password changed",
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * Deactivate user (Admin only)
 * PATCH /api/users/:id/deactivate
 */
/**
 * Soft delete user (hide but preserve data)
 * PATCH /api/users/:id/soft-delete
 * DELETE /api/users/:id/soft
 */
exports.softDeleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { deletionReason } = req.body;

  const oldUser = await User.findById(id);
  if (!oldUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (oldUser.deletedAt) {
    return next(new ErrorHandler("User is already deleted", 400));
  }

  const user = await User.findByIdAndUpdate(
    id,
    {
      isActive: false,
      deletedAt: new Date(),
      deletedBy: req.user.id,
      deleteType: "soft",
      deletionReason: deletionReason || "",
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "user_soft_deleted",
    targetUser: id,
    details: { deletionReason },
    description: `User ${oldUser.firstName} ${oldUser.lastName} soft deleted`,
    ipAddress,
  });

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    message: "User soft deleted successfully. Can be restored later.",
    user: userData,
  });
});

/**
 * Hard delete user (permanently remove from database)
 * DELETE /api/users/:id/hard
 */
exports.hardDeleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { deletionReason, deleteDependentData } = req.body;

  const oldUser = await User.findById(id);
  if (!oldUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check dependencies
  const FamilyMember = require("../models/familyMemberModel");
  // Event functionality removed
  const Comment = require("../models/commentModel");
  const UserRelationship = require("../models/userRelationshipModel");

  // Check for FamilyMember records linked to this user
  const familyMembersCount = await FamilyMember.countDocuments({ userId: id });
  
  // Check for other User accounts in the same family (same subFamilyNumber)
  const otherFamilyUsersCount = await User.countDocuments({
    subFamilyNumber: oldUser.subFamilyNumber,
    _id: { $ne: id },
    isActive: true,
    deletedAt: null,
  });

  const eventsCount = 0; // Event functionality removed
  const commentsCount = await Comment.countDocuments({ userId: id });
  const relationshipsCount = await UserRelationship.countDocuments({
    $or: [{ user1Id: id }, { user2Id: id }],
  });

  const totalFamilyDependencies = familyMembersCount + otherFamilyUsersCount;

  // If user is still a primary account and has family members, require deleteDependentData or transfer
  // If user is NOT a primary account (was transferred or never was), allow deletion without requiring deleteDependentData for family
  const isStillPrimary = oldUser.isPrimaryAccount;
  const hasFamilyDependencies = totalFamilyDependencies > 0;
  const hasOtherDependencies = eventsCount > 0 || commentsCount > 0 || relationshipsCount > 0;

  // If deleteDependentData is false and there are dependencies:
  // - If user is still primary with family: require deleteDependentData
  // - If user is not primary: only require deleteDependentData for non-family dependencies (events, comments, relationships)
  if (deleteDependentData !== true) {
    if (isStillPrimary && hasFamilyDependencies) {
      // Primary account with family members - must transfer or delete all
      return res.status(400).json({
        success: false,
        message: "Primary account has family members. Transfer primary account first or select to delete all family members.",
        dependencies: {
          familyMembers: familyMembersCount,
          familyUserAccounts: otherFamilyUsersCount,
          totalFamilyMembers: totalFamilyDependencies,
          events: eventsCount,
          comments: commentsCount,
          relationships: relationshipsCount,
          isPrimaryAccount: true,
        },
      });
    } else if (hasOtherDependencies) {
      // Non-primary account or no family, but has other dependencies
      return res.status(400).json({
        success: false,
        message: "User has dependent data. Choose to delete all data or reassign.",
        dependencies: {
          familyMembers: familyMembersCount,
          familyUserAccounts: otherFamilyUsersCount,
          totalFamilyMembers: totalFamilyDependencies,
          events: eventsCount,
          comments: commentsCount,
          relationships: relationshipsCount,
          isPrimaryAccount: isStillPrimary,
        },
      });
    }
    // If not primary and no other dependencies, allow deletion (family members will remain)
  }

  // Delete or reassign dependent data
  if (deleteDependentData === true) {
    // Delete family member records
    await FamilyMember.deleteMany({ userId: id });
    
    // Delete other User accounts in the same family (if they are family member accounts)
    if (oldUser.subFamilyNumber) {
      await User.deleteMany({
        subFamilyNumber: oldUser.subFamilyNumber,
        _id: { $ne: id },
        isPrimaryAccount: false, // Only delete non-primary family member accounts
      });
    }
    
    // Set events createdBy to null or delete
    // Event functionality removed
    
    // Set comments userId to null or mark as deleted
    await Comment.updateMany({ userId: id }, { userId: null, commentText: "[Deleted User]" });
    
    // Delete relationships
    await UserRelationship.deleteMany({
      $or: [{ user1Id: id }, { user2Id: id }],
    });
  }

  // Log activity before deletion
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "user_hard_deleted",
    targetUser: id,
    details: { deletionReason, deleteDependentData },
    description: `User ${oldUser.firstName} ${oldUser.lastName} permanently deleted`,
    ipAddress,
  });

  // Permanently delete user
  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "User permanently deleted from database",
  });
});

/**
 * Restore soft deleted user
 * PATCH /api/users/:id/restore
 */
exports.restoreUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const oldUser = await User.findById(id);
  if (!oldUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!oldUser.deletedAt) {
    return next(new ErrorHandler("User is not deleted", 400));
  }

  if (oldUser.deleteType === "hard") {
    return next(new ErrorHandler("Cannot restore hard deleted user", 400));
  }

  const user = await User.findByIdAndUpdate(
    id,
    {
      isActive: true,
      deletedAt: null,
      deletedBy: null,
      deleteType: null,
      deletionReason: null,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "user_restored",
    targetUser: id,
    details: {},
    description: `User ${oldUser.firstName} ${oldUser.lastName} restored`,
    ipAddress,
  });

  // Convert to object and remove sensitive fields
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    message: "User restored successfully",
    user: userData,
  });
});

/**
 * Get soft deleted users (admin only)
 * GET /api/users/deleted
 */
exports.getDeletedUsers = catchAsyncErrors(async (req, res, next) => {
  const { page = 1, limit = 20, deleteType = "soft" } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const query = {
    $or: [{ isActive: false }, { deletedAt: { $ne: null } }],
  };

  if (deleteType === "soft") {
    query.deleteType = "soft";
  } else if (deleteType === "hard") {
    // Hard deleted users are gone, so we can only show activity logs
    return res.status(200).json({
      success: true,
      message: "Hard deleted users are permanently removed. Check activity logs for deletion history.",
      count: 0,
      users: [],
    });
  }

  const users = await User.find(query)
    .populate("deletedBy", "firstName lastName")
    .populate("roleRef")
    .sort({ deletedAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select("-password -passwordResetToken -passwordResetExpires");

  const total = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    users,
  });
});

/**
 * Deactivate user (legacy - now uses soft delete)
 * PATCH /api/users/:id/deactivate
 */
exports.deactivateUser = catchAsyncErrors(async (req, res, next) => {
  // Redirect to soft delete
  return exports.softDeleteUser(req, res, next);
});

/**
 * Get family members by subFamilyNumber
 * GET /api/users/family/:subFamilyNumber
 */
exports.getFamilyMembers = catchAsyncErrors(async (req, res, next) => {
  const { subFamilyNumber } = req.params;

  if (!subFamilyNumber) {
    return next(new ErrorHandler("Sub-family number is required", 400));
  }

  // Get all users with the same subFamilyNumber
  const familyMembers = await User.find({
    subFamilyNumber,
    isActive: true,
    deletedAt: null,
    status: "approved",
  })
    .select("-password -passwordResetToken -passwordResetExpires")
    .sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    count: familyMembers.length,
    subFamilyNumber,
    familyMembers,
  });
});

/**
 * Get combined family members (Users + FamilyMembers) by subFamilyNumber with search and pagination
 * GET /api/users/family-complete/:subFamilyNumber
 */
exports.getCombinedFamilyMembers = catchAsyncErrors(async (req, res, next) => {
  const { subFamilyNumber } = req.params;
  const { page = 1, limit = 10, search = "", type = "all" } = req.query;

  if (!subFamilyNumber) {
    return next(new ErrorHandler("Sub-family number is required", 400));
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build search regex
  const searchRegex = search
    ? new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
    : null;

  // Fetch users and family members in parallel
  const FamilyMember = require("../models/familyMemberModel");

  let usersQuery = {
    subFamilyNumber,
    isActive: true,
    deletedAt: null,
    status: "approved",
  };

  let familyMembersQuery = {
    subFamilyNumber,
    approvalStatus: "approved",
    isActive: true,
    deletedAt: null,
  };

  // Apply search filter if provided
  if (searchRegex) {
    usersQuery.$or = [
      { firstName: searchRegex },
      { middleName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { mobileNumber: searchRegex },
    ];

    familyMembersQuery.$or = [
      { firstName: searchRegex },
      { middleName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { mobileNumber: searchRegex },
    ];
  }

  // Fetch based on type filter
  let users = [];
  let familyMembers = [];

  if (type === "all" || type === "users") {
    users = await User.find(usersQuery)
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: 1 })
      .lean();
  }

  if (type === "all" || type === "familyMembers") {
    familyMembers = await FamilyMember.find(familyMembersQuery)
      .select("-__v")
      .sort({ createdAt: 1 })
      .lean();
  }

  // Normalize data structure - combine both types
  const combinedMembers = [];

  // Add users with type indicator
  users.forEach((user) => {
    combinedMembers.push({
      ...user,
      memberType: "user",
      id: user._id,
    });
  });

  // Add family members with type indicator
  familyMembers.forEach((member) => {
    combinedMembers.push({
      ...member,
      memberType: "familyMember",
      id: member._id,
    });
  });

  // Sort combined array by name (first name)
  combinedMembers.sort((a, b) => {
    const nameA = (a.firstName || "").toLowerCase();
    const nameB = (b.firstName || "").toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Apply pagination
  const total = combinedMembers.length;
  const paginatedMembers = combinedMembers.slice(skip, skip + limitNum);
  const totalPages = Math.ceil(total / limitNum);

  res.status(200).json({
    success: true,
    data: {
      members: paginatedMembers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        total,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      subFamilyNumber,
    },
  });
});

/**
 * Get all users and family members (Admin only)
 * GET /api/users/admin/all-users
 */
exports.getAllUsersAndFamilyMembers = catchAsyncErrors(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    type, // 'user' or 'family_member' or undefined for all
    status, // For users: pending, approved, rejected
    approvalStatus, // For family members: pending, approved, rejected
    search,
    subFamilyNumber,
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const results = [];

  // Get Users if type is 'user' or undefined
  if (!type || type === "user") {
    const userFilter = {};
    if (status) userFilter.status = status;
    if (subFamilyNumber) userFilter.subFamilyNumber = subFamilyNumber;
    if (search) {
      userFilter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
        { subFamilyNumber: { $regex: search, $options: "i" } },
      ];
    }
    userFilter.isActive = true;
    userFilter.deletedAt = null;

    const users = await User.find(userFilter)
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 })
      .lean();

    users.forEach((user) => {
      results.push({
        ...user,
        _type: "user",
        displayName: `${user.firstName} ${user.lastName}`,
        displayEmail: user.email || "-",
        displayMobile: user.mobileNumber || "-",
        displayStatus: user.status,
      });
    });
  }

  // Get Family Members if type is 'family_member' or undefined
  if (!type || type === "family_member") {
    const FamilyMember = require("../models/familyMemberModel");
    const familyFilter = {};
    if (approvalStatus) familyFilter.approvalStatus = approvalStatus;
    if (subFamilyNumber) familyFilter.subFamilyNumber = subFamilyNumber;
    if (search) {
      familyFilter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
        { subFamilyNumber: { $regex: search, $options: "i" } },
      ];
    }
    familyFilter.isActive = true;

    const familyMembers = await FamilyMember.find(familyFilter)
      .populate("userId", "firstName lastName email subFamilyNumber")
      .sort({ createdAt: -1 })
      .lean();

    familyMembers.forEach((member) => {
      results.push({
        ...member,
        _type: "family_member",
        displayName: `${member.firstName} ${member.middleName ? member.middleName + " " : ""}${member.lastName}`,
        displayEmail: member.email || "-",
        displayMobile: member.mobileNumber || "-",
        displayStatus: member.approvalStatus,
        displayRelationship: member.relationshipToUser,
      });
    });
  }

  // Sort all results by createdAt (newest first)
  results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Apply pagination
  const total = results.length;
  const paginatedResults = results.slice(skip, skip + parseInt(limit));

  res.status(200).json({
    success: true,
    count: paginatedResults.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: paginatedResults,
  });
});

/**
 * Get family members for transfer (includes both User accounts and FamilyMember records)
 * GET /api/users/:id/family-for-transfer
 */
exports.getFamilyMembersForTransfer = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // Primary user ID

  const primaryUser = await User.findById(id);
  if (!primaryUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (!primaryUser.isPrimaryAccount) {
    return next(new ErrorHandler("User is not a primary account holder", 400));
  }

  const FamilyMember = require("../models/familyMemberModel");

  // Get all User accounts in the same family (excluding the primary)
  const familyUserAccounts = await User.find({
    subFamilyNumber: primaryUser.subFamilyNumber,
    _id: { $ne: id },
    isActive: true,
    deletedAt: null,
    status: "approved",
  })
    .select("-password -passwordResetToken -passwordResetExpires")
    .sort({ createdAt: 1 });

  // Get all FamilyMember records under this primary
  const familyMemberRecords = await FamilyMember.find({
    userId: id,
  }).sort({ createdAt: 1 });

  // Filter User accounts to only show those with login (for primary transfer)
  const eligibleForPrimary = familyUserAccounts.filter(
    (user) => !user.isPrimaryAccount
  );

  res.status(200).json({
    success: true,
    data: {
      eligibleForPrimary: eligibleForPrimary.map((user) => ({
        _id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isPrimaryAccount: user.isPrimaryAccount,
        type: "user_account",
      })),
      familyMemberRecords: familyMemberRecords.map((fm) => ({
        _id: fm._id,
        name: `${fm.firstName} ${fm.middleName ? fm.middleName + " " : ""}${fm.lastName}`,
        relationshipToUser: fm.relationshipToUser,
        email: fm.email,
        mobileNumber: fm.mobileNumber,
        hasLoginAccount: !!fm.linkedUserId,
        linkedUserId: fm.linkedUserId,
        type: "family_member",
      })),
      totalFamilyMembers: familyMemberRecords.length,
      totalEligibleForPrimary: eligibleForPrimary.length,
    },
  });
});

/**
 * Bulk approve users (Admin only)
 * PATCH /api/users/bulk-approve
 */
exports.bulkApproveUsers = catchAsyncErrors(async (req, res, next) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return next(
      new ErrorHandler("Please provide an array of user IDs to approve", 400)
    );
  }

  // Update all users
  const result = await User.updateMany(
    { _id: { $in: userIds } },
    { status: "approved" }
  );

  // Get updated users for logging
  const updatedUsers = await User.find({ _id: { $in: userIds } });

  // Log activity for each user
  const ipAddress = req.ip || req.connection.remoteAddress;
  for (const user of updatedUsers) {
    await logActivity({
      performedBy: req.user.id,
      actionType: "user_approved",
      targetUser: user._id,
      details: {
        oldStatus: "pending",
        newStatus: "approved",
        bulkOperation: true,
      },
      description: `User ${user.firstName} ${user.lastName} approved (bulk operation)`,
      ipAddress,
    });
  }

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} user(s) approved successfully`,
    modifiedCount: result.modifiedCount,
  });
});

/**
 * Bulk reject users (Admin only)
 * PATCH /api/users/bulk-reject
 */
exports.bulkRejectUsers = catchAsyncErrors(async (req, res, next) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return next(
      new ErrorHandler("Please provide an array of user IDs to reject", 400)
    );
  }

  // Update all users
  const result = await User.updateMany(
    { _id: { $in: userIds } },
    { status: "rejected" }
  );

  // Get updated users for logging
  const updatedUsers = await User.find({ _id: { $in: userIds } });

  // Log activity for each user
  const ipAddress = req.ip || req.connection.remoteAddress;
  for (const user of updatedUsers) {
    await logActivity({
      performedBy: req.user.id,
      actionType: "user_rejected",
      targetUser: user._id,
      details: {
        oldStatus: "pending",
        newStatus: "rejected",
        bulkOperation: true,
      },
      description: `User ${user.firstName} ${user.lastName} rejected (bulk operation)`,
      ipAddress,
    });
  }

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} user(s) rejected successfully`,
    modifiedCount: result.modifiedCount,
  });
});

/**
 * Search users (for family connections and easy finding)
 * GET /api/users/search
 */
/**
 * Search users (admin/moderator only) with advanced filters
 * GET /api/users/search
 */
exports.searchUsers = catchAsyncErrors(async (req, res, next) => {
  const {
    q,
    role,
    status,
    samaj,
    country,
    startDate,
    endDate,
    minAge,
    maxAge,
    minFamilySize,
    maxFamilySize,
    page = 1,
    limit = 20,
  } = req.query;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  // Build search filter
  const filter = {};

  // Text search across multiple fields (case-insensitive)
  if (q) {
    filter.$or = [
      { firstName: { $regex: q, $options: "i" } },
      { lastName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { mobileNumber: { $regex: q, $options: "i" } },
      { subFamilyNumber: { $regex: q, $options: "i" } },
    ];
  }

  // Filter by role
  if (role) {
    filter.role = role;
  }

  // Filter by status
  if (status) {
    filter.status = status;
  }

  // Filter by samaj
  if (samaj) {
    filter.samaj = samaj;
  }

  // Filter by country
  if (country) {
    filter["address.country"] = country;
  }

  // Filter by registration date range
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      // Set to end of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Filter by age range
  if (minAge || maxAge) {
    filter.age = {};
    if (minAge) {
      filter.age.$gte = parseInt(minAge);
    }
    if (maxAge) {
      filter.age.$lte = parseInt(maxAge);
    }
  }

  // Filter out deleted users (unless specifically requesting deleted users)
  const includeDeleted = req.query.includeDeleted === "true";
  if (!includeDeleted) {
    filter.isActive = true;
    filter.deletedAt = null;
  }

  // Execute query with pagination
  const total = await User.countDocuments(filter);

  let users = await User.find(filter)
    .select("-password -passwordResetToken -passwordResetExpires")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Filter by family size (post-query since it's a computed field)
  if (minFamilySize || maxFamilySize) {
    users = users.filter((user) => {
      const familySize = user.familyMembersCount || 0;
      if (minFamilySize && familySize < parseInt(minFamilySize)) return false;
      if (maxFamilySize && familySize > parseInt(maxFamilySize)) return false;
      return true;
    });
  }

  res.status(200).json({
    success: true,
    count: users.length,
    total: total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    users,
  });
});

/**
 * Transfer primary account ownership (Admin only)
 * PATCH /api/admin/users/:id/transfer-primary
 */
exports.transferPrimaryAccount = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params; // Current primary user ID
  const { newPrimaryUserId, reason, familyMemberIds } = req.body; // familyMemberIds is array of IDs to transfer
  const adminId = req.user.id;

  if (!newPrimaryUserId) {
    return next(new ErrorHandler("New primary user ID is required", 400));
  }

  // Get current primary user
  const currentPrimary = await User.findById(id);
  if (!currentPrimary) {
    return next(new ErrorHandler("Current primary user not found", 404));
  }

  if (!currentPrimary.isPrimaryAccount) {
    return next(
      new ErrorHandler("User is not a primary account holder", 400)
    );
  }

  // Get new primary user
  const newPrimary = await User.findById(newPrimaryUserId);
  if (!newPrimary) {
    return next(new ErrorHandler("New primary user not found", 404));
  }

  // Verify both users are in the same family
  if (currentPrimary.subFamilyNumber !== newPrimary.subFamilyNumber) {
    return next(
      new ErrorHandler(
        "Cannot transfer primary account to user from different family",
        400
      )
    );
  }

  // Verify new primary is currently a family member account (not already primary)
  // This ensures only one primary per family at any time
  if (newPrimary.isPrimaryAccount && newPrimary.subFamilyNumber === currentPrimary.subFamilyNumber) {
    return next(
      new ErrorHandler(
        "Selected user is already a primary account holder in this family. Only one primary account per family is allowed.",
        400
      )
    );
  }

  // Ensure only one primary per family: Set all other users in this family to non-primary
  await User.updateMany(
    { 
      subFamilyNumber: currentPrimary.subFamilyNumber,
      _id: { $ne: id }, // Don't update the current primary yet
      isPrimaryAccount: true 
    },
    { 
      isPrimaryAccount: false 
    }
  );

  // Get FamilyMember model
  const FamilyMember = require("../models/familyMemberModel");

  // Get all family members under current primary
  const allFamilyMembers = await FamilyMember.find({ userId: id });
  const familyMemberIdsToTransfer = familyMemberIds || allFamilyMembers.map(fm => fm._id.toString());

  // Build transfer history chain
  // Get existing transfer history from current primary (if any)
  const existingHistory = currentPrimary.transferHistory || [];
  
  // Create new transfer record
  const transferRecord = {
    fromUserId: currentPrimary._id,
    fromUserName: `${currentPrimary.firstName} ${currentPrimary.lastName}`,
    toUserId: newPrimary._id,
    toUserName: `${newPrimary.firstName} ${newPrimary.lastName}`,
    transferredBy: adminId,
    transferredAt: new Date(),
    reason: reason || "Primary account transfer",
    familyMembersMigrated: 0, // Will be updated after migration
  };

  // Update current primary - remove primary status (but don't mark as deceased unless explicitly stated)
  currentPrimary.isPrimaryAccount = false;
  // Only mark as deceased if explicitly stated in reason
  if (reason && (reason.toLowerCase().includes("deceased") || reason.toLowerCase().includes("death") || reason.toLowerCase().includes("passed away"))) {
    currentPrimary.status = "deceased";
    currentPrimary.isActive = false;
  }
  // Add this transfer to current primary's history (they were transferred FROM)
  if (!currentPrimary.transferHistory) {
    currentPrimary.transferHistory = [];
  }
  currentPrimary.transferHistory.push(transferRecord);
  await currentPrimary.save();

  // Migrate selected family members from old primary to new primary
  let migratedCount = 0;
  if (familyMemberIdsToTransfer.length > 0) {
    const migrationResult = await FamilyMember.updateMany(
      { 
        _id: { $in: familyMemberIdsToTransfer },
        userId: id 
      },
      { 
        userId: newPrimaryUserId,
      }
    );
    migratedCount = migrationResult.modifiedCount;
  }

  // Update transfer record with actual migrated count
  transferRecord.familyMembersMigrated = migratedCount;

  // Update new primary - make them primary and build full transfer history
  newPrimary.isPrimaryAccount = true;
  newPrimary.transferredFrom = currentPrimary._id;
  newPrimary.transferredAt = new Date();
  newPrimary.transferredBy = adminId;
  newPrimary.transferReason = reason || "Primary account transfer";
  
  // Build full transfer history chain: existing history + new transfer
  if (!newPrimary.transferHistory) {
    newPrimary.transferHistory = [];
  }
  // Add all previous transfers from the old primary's history
  newPrimary.transferHistory = [...existingHistory, transferRecord];
  
  await newPrimary.save();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: adminId,
    actionType: "primary_account_transferred",
    targetUser: newPrimaryUserId,
    details: {
      oldPrimaryId: currentPrimary._id,
      oldPrimaryName: `${currentPrimary.firstName} ${currentPrimary.lastName}`,
      newPrimaryName: `${newPrimary.firstName} ${newPrimary.lastName}`,
      reason: reason || "",
      familyMembersMigrated: migratedCount,
    },
    description: `Primary account transferred from ${currentPrimary.firstName} ${currentPrimary.lastName} to ${newPrimary.firstName} ${newPrimary.lastName}. ${migratedCount} family member(s) migrated.`,
    ipAddress,
  });

  // Convert to object and remove sensitive fields
  const newPrimaryData = newPrimary.toObject();
  delete newPrimaryData.password;
  delete newPrimaryData.passwordResetToken;
  delete newPrimaryData.passwordResetExpires;

  res.status(200).json({
    success: true,
    message: `Primary account transferred successfully. ${migratedCount} family member(s) migrated.`,
    data: {
      oldPrimary: {
        id: currentPrimary._id,
        name: `${currentPrimary.firstName} ${currentPrimary.lastName}`,
        status: currentPrimary.status,
        transferHistory: currentPrimary.transferHistory || [],
      },
      newPrimary: {
        ...newPrimaryData,
        transferHistory: newPrimary.transferHistory || [],
      },
      familyMembersMigrated: migratedCount,
      transferRecord: transferRecord,
    },
  });
});

const UserRelationship = require("../models/userRelationshipModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { logActivity } = require("../utils/activityLogger");

/**
 * Send family connection request
 * POST /api/user-relationships
 */
exports.sendConnectionRequest = catchAsyncErrors(async (req, res, next) => {
  const { user2Id, relationshipType, relationshipFrom, note } = req.body;
  const user1Id = req.user.id;

  // Validate inputs
  if (!user2Id || !relationshipType || !relationshipFrom) {
    return next(
      new ErrorHandler("user2Id, relationshipType, and relationshipFrom are required", 400)
    );
  }

  // Cannot link to yourself
  if (user1Id.toString() === user2Id.toString()) {
    return next(new ErrorHandler("Cannot create relationship with yourself", 400));
  }

  // Check if user2 exists
  const user2 = await User.findById(user2Id);
  if (!user2 || !user2.isActive || user2.deletedAt) {
    return next(new ErrorHandler("Target user not found or inactive", 404));
  }

  // Check if relationship already exists
  const existingRelationship = await UserRelationship.findOne({
    $or: [
      { user1Id, user2Id },
      { user1Id: user2Id, user2Id: user1Id },
    ],
  });

  if (existingRelationship) {
    if (existingRelationship.status === "accepted") {
      return next(new ErrorHandler("Relationship already exists and is accepted", 400));
    }
    if (existingRelationship.status === "pending") {
      return next(new ErrorHandler("Relationship request already pending", 400));
    }
    // If rejected, allow new request
  }

  // Create relationship request
  const relationship = await UserRelationship.create({
    user1Id,
    user2Id,
    relationshipType,
    relationshipFrom,
    status: "pending",
    requestedBy: user1Id,
    note: note || "",
  });

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: user1Id,
    actionType: "relationship_request_sent",
    targetUser: user2Id,
    details: { relationshipType, relationshipFrom },
    description: `Sent ${relationshipType} relationship request to ${user2.firstName} ${user2.lastName}`,
    ipAddress,
  });

  const populatedRelationship = await UserRelationship.findById(relationship._id)
    .populate("user1Id", "firstName lastName email")
    .populate("user2Id", "firstName lastName email")
    .populate("requestedBy", "firstName lastName");

  res.status(201).json({
    success: true,
    message: "Connection request sent successfully",
    data: populatedRelationship,
  });
});

/**
 * Get relationship requests (pending, sent, received)
 * GET /api/user-relationships
 */
exports.getRelationships = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { status, type } = req.query; // status: pending, accepted, rejected | type: sent, received

  const query = {
    $or: [{ user1Id: userId }, { user2Id: userId }],
  };

  if (status) {
    query.status = status;
  }

  let relationships = await UserRelationship.find(query)
    .populate("user1Id", "firstName lastName email profileImage")
    .populate("user2Id", "firstName lastName email profileImage")
    .populate("requestedBy", "firstName lastName")
    .populate("approvedBy", "firstName lastName")
    .sort({ createdAt: -1 });

  // Filter by type (sent vs received)
  if (type === "sent") {
    relationships = relationships.filter((rel) => rel.requestedBy.toString() === userId);
  } else if (type === "received") {
    relationships = relationships.filter((rel) => rel.requestedBy.toString() !== userId);
  }

  res.status(200).json({
    success: true,
    count: relationships.length,
    data: relationships,
  });
});

/**
 * Accept relationship request
 * PATCH /api/user-relationships/:id/accept
 */
exports.acceptRelationship = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const relationship = await UserRelationship.findById(id);
  if (!relationship) {
    return next(new ErrorHandler("Relationship request not found", 404));
  }

  // Check if user is the recipient (not the requester)
  if (relationship.requestedBy.toString() === userId.toString()) {
    return next(new ErrorHandler("Cannot accept your own request", 400));
  }

  // Check if user is user1 or user2
  const isUser1 = relationship.user1Id.toString() === userId.toString();
  const isUser2 = relationship.user2Id.toString() === userId.toString();

  if (!isUser1 && !isUser2) {
    return next(new ErrorHandler("You are not part of this relationship", 403));
  }

  if (relationship.status === "accepted") {
    return next(new ErrorHandler("Relationship already accepted", 400));
  }

  // Update relationship
  relationship.status = "accepted";
  relationship.approvedBy = userId;
  await relationship.save();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  const otherUser = isUser1 ? relationship.user2Id : relationship.user1Id;
  await logActivity({
    performedBy: userId,
    actionType: "relationship_accepted",
    targetUser: otherUser,
    details: { relationshipType: relationship.relationshipType },
    description: `Accepted ${relationship.relationshipType} relationship request`,
    ipAddress,
  });

  const populatedRelationship = await UserRelationship.findById(relationship._id)
    .populate("user1Id", "firstName lastName email profileImage")
    .populate("user2Id", "firstName lastName email profileImage")
    .populate("requestedBy", "firstName lastName")
    .populate("approvedBy", "firstName lastName");

  res.status(200).json({
    success: true,
    message: "Relationship request accepted",
    data: populatedRelationship,
  });
});

/**
 * Reject relationship request
 * PATCH /api/user-relationships/:id/reject
 */
exports.rejectRelationship = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const relationship = await UserRelationship.findById(id);
  if (!relationship) {
    return next(new ErrorHandler("Relationship request not found", 404));
  }

  // Check if user is the recipient (not the requester)
  if (relationship.requestedBy.toString() === userId.toString()) {
    return next(new ErrorHandler("Cannot reject your own request", 400));
  }

  // Check if user is user1 or user2
  const isUser1 = relationship.user1Id.toString() === userId.toString();
  const isUser2 = relationship.user2Id.toString() === userId.toString();

  if (!isUser1 && !isUser2) {
    return next(new ErrorHandler("You are not part of this relationship", 403));
  }

  if (relationship.status === "rejected") {
    return next(new ErrorHandler("Relationship already rejected", 400));
  }

  // Update relationship
  relationship.status = "rejected";
  await relationship.save();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  const otherUser = isUser1 ? relationship.user2Id : relationship.user1Id;
  await logActivity({
    performedBy: userId,
    actionType: "relationship_rejected",
    targetUser: otherUser,
    details: { relationshipType: relationship.relationshipType },
    description: `Rejected ${relationship.relationshipType} relationship request`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Relationship request rejected",
  });
});

/**
 * Delete relationship
 * DELETE /api/user-relationships/:id
 */
exports.deleteRelationship = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const relationship = await UserRelationship.findById(id);
  if (!relationship) {
    return next(new ErrorHandler("Relationship not found", 404));
  }

  // Check if user is part of the relationship
  const isUser1 = relationship.user1Id.toString() === userId.toString();
  const isUser2 = relationship.user2Id.toString() === userId.toString();

  if (!isUser1 && !isUser2) {
    return next(new ErrorHandler("You are not part of this relationship", 403));
  }

  // Delete relationship
  await UserRelationship.findByIdAndDelete(id);

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  const otherUser = isUser1 ? relationship.user2Id : relationship.user1Id;
  await logActivity({
    performedBy: userId,
    actionType: "relationship_deleted",
    targetUser: otherUser,
    details: { relationshipType: relationship.relationshipType },
    description: `Deleted ${relationship.relationshipType} relationship`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Relationship deleted successfully",
  });
});

/**
 * Get user's family tree (all connected relationships)
 * GET /api/user-relationships/family-tree/:userId
 */
exports.getFamilyTree = catchAsyncErrors(async (req, res, next) => {
  const { userId } = req.params;
  const currentUserId = req.user.id;

  // Check if user has permission (own tree or admin)
  const isAdmin = req.user.roleRef?.permissions?.canViewUsers === true;
  if (userId !== currentUserId.toString() && !isAdmin) {
    return next(new ErrorHandler("You don't have permission to view this family tree", 403));
  }

  // Get all accepted relationships for this user
  const relationships = await UserRelationship.find({
    $or: [{ user1Id: userId }, { user2Id: userId }],
    status: "accepted",
  })
    .populate("user1Id", "firstName lastName email profileImage dateOfBirth")
    .populate("user2Id", "firstName lastName email profileImage dateOfBirth");

  res.status(200).json({
    success: true,
    count: relationships.length,
    data: relationships,
  });
});


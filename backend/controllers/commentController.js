const Comment = require("../models/commentModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Create comment on event
 * POST /api/events/:eventId/comments
 */
exports.createComment = catchAsyncErrors(async (req, res, next) => {
  const { eventId } = req.params;
  const userId = req.user.id;
  const { commentText, commentType, parentCommentId, attachedImage } = req.body;

  // Validate eventId is a valid ObjectId
  if (!eventId || !eventId.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new ErrorHandler("Invalid event ID", 400));
  }

  // Event functionality removed - comments work without event validation
  let finalCommentType = commentType || "general";

  // Check if parent comment exists (for replies)
  if (parentCommentId) {
    const parentComment = await Comment.findById(parentCommentId);
    if (!parentComment) {
      return next(new ErrorHandler("Parent comment not found", 404));
    }
    if (parentComment.parentCommentId) {
      return next(new ErrorHandler("Cannot reply to a reply (max 2 levels)", 400));
    }
  }

  // Check moderation setting (for now, auto-approve; can be made configurable)
  const needsModeration = false; // TODO: Get from settings
  const status = needsModeration ? "pending" : "published";

  const comment = await Comment.create({
    commentText,
    commentType: finalCommentType,
    eventId,
    userId,
    parentCommentId: parentCommentId || null,
    status,
    attachedImage: attachedImage || undefined,
  });

  // Event functionality removed

  const populatedComment = await Comment.findById(comment._id)
    .populate("userId", "firstName lastName profileImage")
    .populate("parentCommentId", "commentText userId");

  res.status(201).json({
    success: true,
    message: needsModeration
      ? "Comment submitted for moderation"
      : "Comment posted successfully",
    data: populatedComment,
  });
});

/**
 * Get comments for an event
 * GET /api/events/:eventId/comments
 */
exports.getCommentsByEvent = catchAsyncErrors(async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50, sort = "recent" } = req.query;
  const userId = req.user?.id;

  // Validate eventId is a valid ObjectId
  if (!eventId || !eventId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(200).json({
      success: true,
      count: 0,
      total: 0,
      page: parseInt(page),
      pages: 0,
      data: [],
    });
  }

  // Event functionality removed - comments work without event validation

  const query = {
    eventId,
    parentCommentId: null, // Only top-level comments
    status: "published",
    isActive: true,
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  let sortOptions = {};

  if (sort === "recent") {
    sortOptions = { createdAt: -1 };
  } else if (sort === "oldest") {
    sortOptions = { createdAt: 1 };
  } else if (sort === "most_liked") {
    sortOptions = { likeCount: -1, createdAt: -1 };
  }

  const comments = await Comment.find(query)
    .populate("userId", "firstName lastName profileImage")
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  // Get replies for each comment
  const commentsWithReplies = await Promise.all(
    comments.map(async (comment) => {
      const replies = await Comment.find({
        parentCommentId: comment._id,
        status: "published",
        isActive: true,
      })
        .populate("userId", "firstName lastName profileImage")
        .sort({ createdAt: 1 })
        .limit(10); // Limit replies per comment

      const commentData = comment.toObject();
      commentData.replies = replies;
      commentData.userLiked = userId
        ? comment.likes.some((likeId) => likeId.toString() === userId)
        : false;
      commentData.canEdit = comment.canUserEdit(userId);
      commentData.canDelete = comment.canUserDelete(userId, req.user?.roleRef?.permissions);

      return commentData;
    })
  );

  const total = await Comment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: commentsWithReplies.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: commentsWithReplies,
  });
});

/**
 * Update comment (own comment only, within time limit)
 * PATCH /api/comments/:commentId
 */
exports.updateComment = catchAsyncErrors(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const { commentText } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  // Check if user can edit
  if (!comment.canUserEdit(userId)) {
    return next(
      new ErrorHandler(
        "You cannot edit this comment. Edit window has expired or comment has replies.",
        403
      )
    );
  }

  comment.commentText = commentText;
  comment.editedAt = Date.now();
  comment.editCount += 1;

  await comment.save();

  const updatedComment = await Comment.findById(commentId)
    .populate("userId", "firstName lastName profileImage");

  res.status(200).json({
    success: true,
    message: "Comment updated successfully",
    data: updatedComment,
  });
});

/**
 * Delete comment
 * DELETE /api/comments/:commentId
 */
exports.deleteComment = catchAsyncErrors(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const user = req.user;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  // Check if user can delete
  if (!comment.canUserDelete(userId, user.roleRef?.permissions)) {
    return next(new ErrorHandler("You don't have permission to delete this comment", 403));
  }

  // Soft delete
  comment.isActive = false;
  comment.status = "deleted";
  comment.commentText = "[Deleted by user]";
  await comment.save();

  // Event functionality removed

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
  });
});

/**
 * Like/Unlike comment
 * POST /api/comments/:commentId/like
 */
exports.likeComment = catchAsyncErrors(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  const likeIndex = comment.likes.findIndex(
    (likeId) => likeId.toString() === userId
  );

  if (likeIndex === -1) {
    // Like
    comment.likes.push(userId);
    comment.likeCount += 1;
  } else {
    // Unlike
    comment.likes.splice(likeIndex, 1);
    comment.likeCount = Math.max(0, comment.likeCount - 1);
  }

  await comment.save();

  res.status(200).json({
    success: true,
    message: likeIndex === -1 ? "Comment liked" : "Comment unliked",
    data: {
      commentId: comment._id,
      likeCount: comment.likeCount,
      isLiked: likeIndex === -1,
    },
  });
});

/**
 * Reply to comment
 * POST /api/comments/:commentId/reply
 */
exports.replyToComment = catchAsyncErrors(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const { commentText, attachedImage } = req.body;

  const parentComment = await Comment.findById(commentId);

  if (!parentComment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  // Check if parent is a reply (max 2 levels)
  if (parentComment.parentCommentId) {
    return next(new ErrorHandler("Cannot reply to a reply (max 2 levels)", 400));
  }

  // Event functionality removed - replies work without event validation

  const reply = await Comment.create({
    commentText,
    commentType: parentComment.commentType, // Inherit type from parent
    eventId: parentComment.eventId,
    userId,
    parentCommentId: commentId,
    status: "published", // Replies auto-approved
    attachedImage: attachedImage || undefined,
  });

  const populatedReply = await Comment.findById(reply._id)
    .populate("userId", "firstName lastName profileImage")
    .populate("parentCommentId", "commentText userId");

  // Event functionality removed

  res.status(201).json({
    success: true,
    message: "Reply posted successfully",
    data: populatedReply,
  });
});

/**
 * Report comment
 * POST /api/comments/:commentId/report
 */
exports.reportComment = catchAsyncErrors(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const { reason, details } = req.body;

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  // Check if user already reported
  const alreadyReported = comment.flaggedBy.some(
    (report) => report.userId.toString() === userId
  );

  if (alreadyReported) {
    return next(new ErrorHandler("You have already reported this comment", 400));
  }

  comment.flagged = true;
  comment.flaggedBy.push({
    userId,
    reason: reason || "other",
    flaggedAt: Date.now(),
  });

  await comment.save();

  res.status(200).json({
    success: true,
    message: "Comment reported successfully. Admin will review it.",
  });
});

/**
 * Get pending comments (admin moderation)
 * GET /api/admin/comments/pending
 */
exports.getPendingComments = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;

  if (!user.roleRef?.permissions?.canModerateComments) {
    return next(new ErrorHandler("You don't have permission to moderate comments", 403));
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const comments = await Comment.find({
    status: "pending",
    isActive: true,
  })
    .populate("userId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Comment.countDocuments({
    status: "pending",
    isActive: true,
  });

  res.status(200).json({
    success: true,
    count: comments.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: comments,
  });
});

/**
 * Get flagged comments (admin moderation)
 * GET /api/admin/comments/flagged
 */
exports.getFlaggedComments = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;

  if (!user.roleRef?.permissions?.canModerateComments) {
    return next(new ErrorHandler("You don't have permission to moderate comments", 403));
  }

  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const comments = await Comment.find({
    flagged: true,
    isActive: true,
  })
    .populate("userId", "firstName lastName email")
    .populate("eventId", "eventName")
    .populate("flaggedBy.userId", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Comment.countDocuments({
    flagged: true,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    count: comments.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: comments,
  });
});

/**
 * Approve/Reject comment (admin moderation)
 * PATCH /api/admin/comments/:commentId/approve
 */
exports.moderateComment = catchAsyncErrors(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const user = req.user;
  const { action } = req.body; // 'approve', 'reject', 'hide', 'dismiss'

  if (!user.roleRef?.permissions?.canModerateComments) {
    return next(new ErrorHandler("You don't have permission to moderate comments", 403));
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    return next(new ErrorHandler("Comment not found", 404));
  }

  if (action === "approve") {
    comment.status = "published";
    comment.approvedBy = userId;
  } else if (action === "reject") {
    comment.status = "hidden";
    comment.isActive = false;
  } else if (action === "hide") {
    comment.status = "hidden";
  } else if (action === "dismiss") {
    comment.flagged = false;
    comment.flaggedBy = [];
  } else {
    return next(new ErrorHandler("Invalid action", 400));
  }

  await comment.save();

  res.status(200).json({
    success: true,
    message: `Comment ${action}d successfully`,
    data: comment,
  });
});


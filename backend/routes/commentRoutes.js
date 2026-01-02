const express = require("express");
const router = express.Router();
const {
  createComment,
  getCommentsByEvent,
  updateComment,
  deleteComment,
  likeComment,
  replyToComment,
  reportComment,
  getPendingComments,
  getFlaggedComments,
  moderateComment,
} = require("../controllers/commentController");
const { authenticate } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   POST /api/events/:eventId/comments
 * @desc    Create comment on event
 * @access  Private (canPostComments)
 */
router.post(
  "/events/:eventId/comments",
  authenticate,
  createComment
);

/**
 * @route   GET /api/events/:eventId/comments
 * @desc    Get comments for an event
 * @access  Public (but filtered by visibility)
 */
router.get("/events/:eventId/comments", getCommentsByEvent);

/**
 * @route   PATCH /api/comments/:commentId
 * @desc    Update own comment
 * @access  Private (comment owner)
 */
router.patch(
  "/:commentId",
  authenticate,
  updateComment
);

/**
 * @route   DELETE /api/comments/:commentId
 * @desc    Delete comment (own or admin)
 * @access  Private (comment owner or canDeleteAnyComment)
 */
router.delete(
  "/:commentId",
  authenticate,
  deleteComment
);

/**
 * @route   POST /api/comments/:commentId/like
 * @desc    Like/Unlike comment
 * @access  Private
 */
router.post(
  "/:commentId/like",
  authenticate,
  likeComment
);

/**
 * @route   POST /api/comments/:commentId/reply
 * @desc    Reply to comment
 * @access  Private (canPostComments)
 */
router.post(
  "/:commentId/reply",
  authenticate,
  replyToComment
);

/**
 * @route   POST /api/comments/:commentId/report
 * @desc    Report comment
 * @access  Private
 */
router.post(
  "/:commentId/report",
  authenticate,
  reportComment
);

/**
 * @route   GET /api/admin/comments/pending
 * @desc    Get pending comments for moderation
 * @access  Private (canModerateComments)
 */
router.get(
  "/admin/pending",
  authenticate,
  authorizePermission("canModerateComments"),
  getPendingComments
);

/**
 * @route   GET /api/admin/comments/flagged
 * @desc    Get flagged comments for moderation
 * @access  Private (canModerateComments)
 */
router.get(
  "/admin/flagged",
  authenticate,
  authorizePermission("canModerateComments"),
  getFlaggedComments
);

/**
 * @route   PATCH /api/admin/comments/:commentId/approve
 * @desc    Approve/Reject/Hide/Dismiss comment
 * @access  Private (canModerateComments)
 */
router.patch(
  "/admin/:commentId/approve",
  authenticate,
  authorizePermission("canModerateComments"),
  moderateComment
);

module.exports = router;


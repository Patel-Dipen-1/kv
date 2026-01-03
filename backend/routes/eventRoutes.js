const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  toggleLike,
  addComment,
  deleteComment,
  voteInPoll,
} = require("../controllers/eventController");
const { authenticate } = require("../middleware/auth");

/**
 * @route   POST /api/events
 * @desc    Create event (Admin only)
 * @access  Private (Admin)
 */
router.post("/", authenticate, createEvent);

/**
 * @route   GET /api/events
 * @desc    Get all events
 * @access  Public (filtered by visibility)
 */
router.get("/", getAllEvents);

/**
 * @route   GET /api/events/:id
 * @desc    Get single event
 * @access  Public (filtered by visibility)
 */
router.get("/:id", getEventById);

/**
 * @route   PUT /api/events/:id
 * @desc    Update event (Admin only)
 * @access  Private (Admin)
 */
router.put("/:id", authenticate, updateEvent);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event (Admin only)
 * @access  Private (Admin)
 */
router.delete("/:id", authenticate, deleteEvent);

/**
 * @route   POST /api/events/:id/like
 * @desc    Like/Unlike event
 * @access  Private
 */
router.post("/:id/like", authenticate, toggleLike);

/**
 * @route   POST /api/events/:id/comment
 * @desc    Add comment to event
 * @access  Private
 */
router.post("/:id/comment", authenticate, addComment);

/**
 * @route   DELETE /api/events/:id/comment/:commentId
 * @desc    Delete comment
 * @access  Private
 */
router.delete("/:id/comment/:commentId", authenticate, deleteComment);

/**
 * @route   POST /api/events/:id/vote
 * @desc    Vote in poll
 * @access  Private
 */
router.post("/:id/vote", authenticate, voteInPoll);

module.exports = router;


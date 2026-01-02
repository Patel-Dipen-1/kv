const express = require("express");
const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  addEventMedia,
  removeEventMedia,
  rsvpToEvent,
  getMyEvents,
  approveEvent,
} = require("../controllers/eventController");
const { authenticate } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");
const upload = require("../utils/Image");

/**
 * @route   POST /api/events
 * @desc    Create new event
 * @access  Private (canCreateEvents)
 */
router.post(
  "/",
  authenticate,
  authorizePermission("canCreateEvents"),
  createEvent
);

/**
 * @route   GET /api/events
 * @desc    Get all events (with filters)
 * @access  Public (but filtered by visibility)
 */
router.get("/", getAllEvents);

/**
 * @route   GET /api/events/my
 * @desc    Get events created by current user
 * @access  Private
 */
router.get("/my", authenticate, getMyEvents);

/**
 * @route   GET /api/events/create
 * @desc    Handle frontend route - return 404 (this is a frontend route)
 * @access  N/A
 */
router.get("/create", (req, res) => {
  res.status(404).json({
    success: false,
    message: "This is a frontend route. Use POST /api/events to create an event.",
  });
});

/**
 * @route   GET /api/events/:id
 * @desc    Get single event by ID
 * @access  Public (but filtered by visibility)
 */
router.get("/:id", getEventById);

/**
 * @route   PATCH /api/events/:id
 * @desc    Update event
 * @access  Private (creator or canEditEvents)
 */
router.patch(
  "/:id",
  authenticate,
  updateEvent
);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event
 * @access  Private (creator or canDeleteEvents)
 */
router.delete(
  "/:id",
  authenticate,
  deleteEvent
);

/**
 * @route   POST /api/events/:id/media
 * @desc    Add media to event (photos, videos, YouTube links)
 * @access  Private (creator or canManageEventMedia)
 */
router.post(
  "/:id/media",
  authenticate,
  upload.fields([
    { name: 'photos', maxCount: 10 },
    { name: 'videos', maxCount: 5 }
  ]),
  addEventMedia
);

/**
 * @route   DELETE /api/events/:id/media/:mediaId
 * @desc    Remove media from event
 * @access  Private (creator or canManageEventMedia)
 */
router.delete(
  "/:id/media/:mediaId",
  authenticate,
  removeEventMedia
);

/**
 * @route   POST /api/events/:id/rsvp
 * @desc    RSVP to event
 * @access  Private
 */
router.post(
  "/:id/rsvp",
  authenticate,
  rsvpToEvent
);

/**
 * @route   PATCH /api/admin/events/:id/approve
 * @desc    Approve/Reject event (admin only)
 * @access  Private (canModerateEvents)
 */
router.patch(
  "/admin/:id/approve",
  authenticate,
  authorizePermission("canModerateEvents"),
  approveEvent
);

module.exports = router;


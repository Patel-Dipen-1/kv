const express = require("express");
const router = express.Router();
const {
  createPoll,
  getPollsByEvent,
  getPollById,
  voteOnPoll,
  changeVote,
  closePoll,
  deletePoll,
} = require("../controllers/pollController");
const { authenticate } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   POST /api/polls
 * @desc    Create new poll (with or without eventId)
 * @access  Private (canCreatePolls)
 */
router.post(
  "/",
  authenticate,
  authorizePermission("canCreatePolls"),
  createPoll
);

/**
 * @route   GET /api/polls/event/:eventId
 * @desc    Get polls for an event
 * @access  Public (but filtered by access control)
 */
router.get("/event/:eventId", getPollsByEvent);

/**
 * @route   GET /api/polls/:pollId
 * @desc    Get single poll by ID with results
 * @access  Public (but filtered by access control)
 */
router.get("/:pollId", getPollById);

/**
 * @route   POST /api/polls/:pollId/vote
 * @desc    Vote on poll
 * @access  Private (canVoteInPolls or anonymous if allowed)
 */
router.post(
  "/:pollId/vote",
  authenticate,
  voteOnPoll
);

/**
 * @route   PATCH /api/polls/:pollId/vote
 * @desc    Change vote (if allowed)
 * @access  Private (canVoteInPolls)
 */
router.patch(
  "/:pollId/vote",
  authenticate,
  changeVote
);

/**
 * @route   PATCH /api/polls/:pollId/close
 * @desc    Close poll early (creator or admin)
 * @access  Private (creator or canManagePolls)
 */
router.patch(
  "/:pollId/close",
  authenticate,
  closePoll
);

/**
 * @route   DELETE /api/polls/:pollId
 * @desc    Delete poll (creator or admin)
 * @access  Private (creator or canManagePolls)
 */
router.delete(
  "/:pollId",
  authenticate,
  deletePoll
);

module.exports = router;


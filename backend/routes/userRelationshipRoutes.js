const express = require("express");
const router = express.Router();
const {
  sendConnectionRequest,
  getRelationships,
  acceptRelationship,
  rejectRelationship,
  deleteRelationship,
  getFamilyTree,
} = require("../controllers/userRelationshipController");
const { authenticate } = require("../middleware/auth");
const { authorizePermission } = require("../middleware/permissions");

/**
 * @route   POST /api/user-relationships
 * @desc    Send family connection request
 * @access  Private
 */
router.post("/", authenticate, sendConnectionRequest);

/**
 * @route   GET /api/user-relationships
 * @desc    Get relationship requests (pending, sent, received)
 * @access  Private
 */
router.get("/", authenticate, getRelationships);

/**
 * @route   PATCH /api/user-relationships/:id/accept
 * @desc    Accept relationship request
 * @access  Private
 */
router.patch("/:id/accept", authenticate, acceptRelationship);

/**
 * @route   PATCH /api/user-relationships/:id/reject
 * @desc    Reject relationship request
 * @access  Private
 */
router.patch("/:id/reject", authenticate, rejectRelationship);

/**
 * @route   DELETE /api/user-relationships/:id
 * @desc    Delete relationship
 * @access  Private
 */
router.delete("/:id", authenticate, deleteRelationship);

/**
 * @route   GET /api/user-relationships/family-tree/:userId
 * @desc    Get user's family tree (all connected relationships)
 * @access  Private (own tree or admin)
 */
router.get("/family-tree/:userId", authenticate, getFamilyTree);

module.exports = router;


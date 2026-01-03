const express = require("express");
const router = express.Router();
const {
  getLocationByCity,
  searchCities,
  getAllCities,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

/**
 * @route   GET /api/locations?city=Ahmedabad
 * @desc    Get location by city name (Public)
 * @access  Public
 */
router.get("/", getLocationByCity);

/**
 * @route   GET /api/locations/search?q=ahme
 * @desc    Search cities for autocomplete (Public)
 * @access  Public
 */
router.get("/search", searchCities);

/**
 * @route   GET /api/locations/cities?country=India
 * @desc    Get all unique cities for dropdown (Public)
 * @access  Public
 */
router.get("/cities", getAllCities);

/**
 * @route   GET /api/locations/all
 * @desc    Get all locations with filters (Admin)
 * @access  Private (Admin)
 */
router.get(
  "/all",
  authenticate,
  authorizeRoles("admin"),
  getAllLocations
);

/**
 * @route   POST /api/locations
 * @desc    Create new location (Admin)
 * @access  Private (Admin)
 */
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  createLocation
);

/**
 * @route   PUT /api/locations/:id
 * @desc    Update location (Admin)
 * @access  Private (Admin)
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  updateLocation
);

/**
 * @route   DELETE /api/locations/:id
 * @desc    Delete location (Admin - soft delete)
 * @access  Private (Admin)
 */
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  deleteLocation
);

module.exports = router;


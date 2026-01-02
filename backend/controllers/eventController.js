const Event = require("../models/eventModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Create new event
 * POST /api/events
 */
exports.createEvent = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const user = req.user;

  // Populate roleRef if not already populated
  if (!user.roleRef || typeof user.roleRef === 'string') {
    await user.populate('roleRef');
  }

  // Check if user has permission (will be checked by middleware, but double-check)
  // Regular users submit for approval, admins auto-approve
  const isAdmin = user.roleRef?.permissions?.get?.('canCreateEvents') === true || 
                  user.roleRef?.permissions?.canCreateEvents === true;

  // Clean and trim string values to remove trailing commas and whitespace
  const cleanStringValue = (value) => {
    if (typeof value === 'string') {
      return value.trim().replace(/,$/, ''); // Remove trailing comma
    }
    return value;
  };

  const eventData = {
    ...req.body,
    createdBy: userId,
    approvalStatus: isAdmin ? "approved" : "pending",
    approvedBy: isAdmin ? userId : undefined,
    approvedAt: isAdmin ? new Date() : undefined,
    isActive: true, // Explicitly set isActive to true
  };

  // Clean string fields that might have trailing commas
  if (eventData.eventType) eventData.eventType = cleanStringValue(eventData.eventType);
  if (eventData.visibility) eventData.visibility = cleanStringValue(eventData.visibility);
  if (eventData.status) eventData.status = cleanStringValue(eventData.status);
  if (eventData.approvalStatus) eventData.approvalStatus = cleanStringValue(eventData.approvalStatus);

  // Auto-set comment type for funeral events
  if (eventData.eventType === "funeral" || eventData.eventType === "condolence") {
    eventData.allowComments = true; // Always allow condolences
    eventData.commentType = "condolence";
  }

  const event = await Event.create(eventData);

  // Update event counts if needed
  await Event.findByIdAndUpdate(event._id, {
    $inc: { viewCount: 0 }, // Initialize
  });

  res.status(201).json({
    success: true,
    message: isAdmin
      ? "Event created successfully"
      : "Event submitted for approval",
    data: event,
  });
});

/**
 * Get all events (with filters)
 * GET /api/events
 */
exports.getAllEvents = catchAsyncErrors(async (req, res, next) => {
  const {
    eventType,
    status,
    startDate,
    endDate,
    city,
    samaj,
    search,
    page = 1,
    limit = 20,
    sort = "startDate",
  } = req.query;

  // Get user to check if they're admin (can see all events including pending)
  const user = req.user;
  let isAdmin = false;
  let userWithRole = null;
  
  if (user && user._id) {
    // Fetch user with populated roleRef to check permissions and for visibility filtering
    userWithRole = await User.findById(user._id).populate('roleRef');
    if (userWithRole && userWithRole.roleRef) {
      isAdmin = userWithRole.roleRef.hasPermission('canViewAllEvents') ||
                userWithRole.roleRef.hasPermission('canManageEvents') ||
                userWithRole.roleRef.hasPermission('canModerateEvents') ||
                userWithRole.role === 'admin' ||
                userWithRole.roleRef.roleKey === 'admin';
    }
  }

  const query = {
    isActive: true,
  };

  // Only filter by approvalStatus if user is not admin
  // Admins can see all events (approved, pending, rejected)
  // Regular users can only see approved events
  // Handle both "approved" and "approved," (with trailing comma) for data cleanup
  if (!isAdmin) {
    // Use regex to match "approved" with or without trailing comma/whitespace
    query.approvalStatus = { $regex: /^approved\s*,?\s*$/i };
  }

  // Filter by event type
  if (eventType) {
    if (Array.isArray(eventType)) {
      query.eventType = { $in: eventType };
    } else {
      query.eventType = eventType;
    }
  }

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by date range
  if (startDate || endDate) {
    query.startDate = {};
    if (startDate) query.startDate.$gte = new Date(startDate);
    if (endDate) query.startDate.$lte = new Date(endDate);
  }

  // Filter by city
  if (city) {
    query["location.city"] = new RegExp(city, "i");
  }

  // Search in name and description
  if (search) {
    query.$or = [
      { eventName: new RegExp(search, "i") },
      { description: new RegExp(search, "i") },
    ];
  }

  // Visibility filter - user can only see events they have access to
  // (user is already declared above, visibility filtering happens in results)

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};

  // Sort by pinned first, then by specified field
  if (sort === "startDate") {
    sortOptions.isPinned = -1;
    sortOptions.startDate = 1;
  } else if (sort === "createdAt") {
    sortOptions.isPinned = -1;
    sortOptions.createdAt = -1;
  }

  // Increase limit to show more events (default was 20)
  const eventLimit = parseInt(limit) || 50; // Default to 50 if not specified
  
  const events = await Event.find(query)
    .populate("createdBy", "firstName lastName")
    .populate("relatedPerson", "firstName lastName")
    .sort(sortOptions)
    .skip(skip)
    .limit(eventLimit);

  // Filter by visibility
  // Use userWithRole (with populated roleRef) for visibility checks, or user if not authenticated
  const userForVisibility = userWithRole || user;
  const filteredEvents = userForVisibility
    ? events.filter((event) => {
        // Use canUserView method with properly populated user
        // This method handles public events and all visibility types
        return event.canUserView(userForVisibility);
      })
    : events.filter((event) => {
        // For non-authenticated users, only show public events
        // Also show events with invalid/missing visibility (defaults to public)
        return !event.visibility || 
               event.visibility === "public" || 
               !["public", "samaj", "family", "role"].includes(event.visibility);
      });

  // Calculate total count after visibility filtering (for accurate pagination)
  // But we need to count all matching events, not just the filtered ones
  // So we'll use the filtered count for this page, and estimate total pages
  const totalMatchingEvents = await Event.countDocuments(query);
  // Note: This total is approximate since we filter by visibility after querying
  // For exact count, we'd need to fetch all events and filter, which is expensive
  const total = totalMatchingEvents;

  res.status(200).json({
    success: true,
    count: filteredEvents.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: filteredEvents,
  });
});

/**
 * Get single event by ID
 * GET /api/events/:id
 */
exports.getEventById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  // Validate id is a valid ObjectId (skip special routes like "create", "my", etc.)
  if (!id || id === "create" || id === "my" || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return next(new ErrorHandler("Invalid event ID", 400));
  }

  const event = await Event.findById(id)
    .populate("createdBy", "firstName lastName email")
    .populate("relatedPerson", "firstName lastName")
    .populate("approvedBy", "firstName lastName");

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check visibility
  if (!event.canUserView(user)) {
    return next(new ErrorHandler("You don't have permission to view this event", 403));
  }

  // Increment view count
  event.viewCount += 1;
  await event.save();

  res.status(200).json({
    success: true,
    data: event,
  });
});

/**
 * Update event
 * PATCH /api/events/:id
 */
exports.updateEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const user = req.user;

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check permission: creator or admin
  const isCreator = event.createdBy.toString() === userId;
  const isAdmin = user.roleRef?.permissions?.canEditEvents === true;

  if (!isCreator && !isAdmin) {
    return next(
      new ErrorHandler("You don't have permission to edit this event", 403)
    );
  }

  // Update allowed fields
  const allowedFields = [
    "eventName",
    "eventType",
    "description",
    "startDate",
    "endDate",
    "location",
    "visibility",
    "visibleToSamaj",
    "visibleToRoles",
    "visibleToFamilies",
    "status",
    "isPinned",
    "isImportant",
    "allowRSVP",
    "allowComments",
    "funeralDetails",
    "relatedPerson",
    "relatedPersonName",
    "isRecurring",
    "recurrencePattern",
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate("createdBy", "firstName lastName")
    .populate("relatedPerson", "firstName lastName");

  res.status(200).json({
    success: true,
    message: "Event updated successfully",
    data: updatedEvent,
  });
});

/**
 * Delete event
 * DELETE /api/events/:id
 */
exports.deleteEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const user = req.user;

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check permission: creator or admin
  const isCreator = event.createdBy.toString() === userId;
  const isAdmin = user.roleRef?.permissions?.canDeleteEvents === true;

  if (!isCreator && !isAdmin) {
    return next(
      new ErrorHandler("You don't have permission to delete this event", 403)
    );
  }

  // Soft delete
  event.isActive = false;
  event.status = "cancelled";
  await event.save();

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});

/**
 * Add media to event (photos, videos, YouTube links)
 * POST /api/events/:id/media
 */
exports.addEventMedia = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const user = req.user;
  const path = require('path');

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check permission
  const isCreator = event.createdBy.toString() === userId;
  const isAdmin = user.roleRef?.permissions?.canManageEventMedia === true;

  if (!isCreator && !isAdmin) {
    return next(
      new ErrorHandler("You don't have permission to manage media for this event", 403)
    );
  }

  // Handle file uploads (photos and videos)
  if (req.files) {
    // Handle photo uploads
    if (req.files.photos && req.files.photos.length > 0) {
      req.files.photos.forEach((file) => {
        const photoUrl = `/uploads/images/${file.filename}`;
        event.photos.push({
          url: photoUrl,
          caption: req.body.photoCaptions?.[file.filename] || "",
          uploadedBy: userId,
          uploadedAt: new Date(),
        });
      });
    }

    // Handle video uploads
    if (req.files.videos && req.files.videos.length > 0) {
      req.files.videos.forEach((file) => {
        const videoUrl = `/uploads/videos/${file.filename}`;
        event.videos.push({
          url: videoUrl,
          caption: req.body.videoCaptions?.[file.filename] || "",
          thumbnail: req.body.videoThumbnails?.[file.filename] || "",
          uploadedBy: userId,
          uploadedAt: new Date(),
        });
      });
    }
  }

  // Handle YouTube links (from request body)
  if (req.body.youtubeLinks) {
    const youtubeLinks = Array.isArray(req.body.youtubeLinks) 
      ? req.body.youtubeLinks 
      : JSON.parse(req.body.youtubeLinks || '[]');
    
    youtubeLinks.forEach((link) => {
      if (link.url) {
        event.youtubeLinks.push({
          url: link.url,
          title: link.title || "",
          description: link.description || "",
          isLive: link.isLive === true || link.isLive === 'true',
          thumbnail: link.thumbnail || "",
        });
      }
    });
  }

  // Handle single YouTube link (backward compatibility)
  if (req.body.youtubeUrl) {
    event.youtubeLinks.push({
      url: req.body.youtubeUrl,
      title: req.body.youtubeTitle || "",
      description: req.body.youtubeDescription || "",
      isLive: req.body.youtubeIsLive === true || req.body.youtubeIsLive === 'true',
      thumbnail: req.body.youtubeThumbnail || "",
    });
  }

  await event.save();

  res.status(200).json({
    success: true,
    message: "Media added successfully",
    data: event,
  });
});

/**
 * Remove media from event
 * DELETE /api/events/:id/media/:mediaId
 */
exports.removeEventMedia = catchAsyncErrors(async (req, res, next) => {
  const { id, mediaId } = req.params;
  const userId = req.user.id;
  const user = req.user;
  const { mediaType } = req.query; // 'photo', 'video', 'youtube'

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check permission
  const isCreator = event.createdBy.toString() === userId;
  const isAdmin = user.roleRef?.permissions?.canManageEventMedia === true;

  if (!isCreator && !isAdmin) {
    return next(
      new ErrorHandler("You don't have permission to manage media for this event", 403)
    );
  }

  if (mediaType === "photo") {
    event.photos = event.photos.filter(
      (photo) => photo._id.toString() !== mediaId
    );
  } else if (mediaType === "video") {
    event.videos = event.videos.filter(
      (video) => video._id.toString() !== mediaId
    );
  } else if (mediaType === "youtube") {
    event.youtubeLinks = event.youtubeLinks.filter(
      (link) => link._id.toString() !== mediaId
    );
  } else {
    return next(new ErrorHandler("Invalid media type", 400));
  }

  await event.save();

  res.status(200).json({
    success: true,
    message: "Media removed successfully",
    data: event,
  });
});

/**
 * RSVP to event
 * POST /api/events/:id/rsvp
 */
exports.rsvpToEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { response } = req.body; // 'attending', 'not_attending', 'maybe'

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  if (!event.allowRSVP) {
    return next(new ErrorHandler("RSVP is not enabled for this event", 400));
  }

  // TODO: Store individual RSVPs in a separate collection
  // For now, just increment counts
  if (response === "attending") {
    event.rsvpCounts.attending += 1;
  } else if (response === "not_attending") {
    event.rsvpCounts.notAttending += 1;
  } else if (response === "maybe") {
    event.rsvpCounts.maybe += 1;
  }

  await event.save();

  res.status(200).json({
    success: true,
    message: "RSVP recorded successfully",
    data: event.rsvpCounts,
  });
});

/**
 * Get my events (created by current user)
 * GET /api/events/my
 */
exports.getMyEvents = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const events = await Event.find({
    createdBy: userId,
    isActive: true,
  })
    .populate("relatedPerson", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Event.countDocuments({
    createdBy: userId,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    count: events.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: events,
  });
});

/**
 * Approve/Reject event (admin only)
 * PATCH /api/admin/events/:id/approve
 */
exports.approveEvent = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { action } = req.body; // 'approve' or 'reject'

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  if (action === "approve") {
    event.approvalStatus = "approved";
    event.approvedBy = userId;
    event.approvedAt = Date.now();
  } else if (action === "reject") {
    event.approvalStatus = "rejected";
    event.isActive = false;
  }

  await event.save();

  res.status(200).json({
    success: true,
    message: `Event ${action === "approve" ? "approved" : "rejected"} successfully`,
    data: event,
  });
});


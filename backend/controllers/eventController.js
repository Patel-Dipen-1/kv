const Event = require("../models/eventModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Create Event (Admin only)
 * POST /api/events
 */
exports.createEvent = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;

  // Check if user exists (should be set by authenticate middleware)
  if (!user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  // Check if user is admin
  if (user.role !== "admin" && user.roleRef?.roleKey !== "admin") {
    return next(new ErrorHandler("Only admins can create events", 403));
  }

  const {
    title,
    description,
    eventType,
    startDate,
    endDate,
    media,
    settings,
    poll,
  } = req.body;

  const eventData = {
    title,
    description,
    eventType: eventType || "normal",
    startDate,
    endDate,
    createdBy: user.id || user._id,
    media: media || {
      images: [],
      files: [],
      youtubeUrl: "",
      externalLink: {},
    },
    settings: {
      commentEnabled: settings?.commentEnabled !== false,
      pollEnabled: settings?.pollEnabled === true,
      visibility: settings?.visibility || "public",
    },
  };

  // Add poll if enabled
  if (settings?.pollEnabled && poll?.question && poll?.options) {
    eventData.poll = {
      question: poll.question,
      options: poll.options.map((text) => ({
        text,
        votes: [],
        voteCount: 0,
      })),
    };
  }

  const event = await Event.create(eventData);

  res.status(201).json({
    success: true,
    message: "Event created successfully",
    data: event,
  });
});

/**
 * Get All Events
 * GET /api/events
 */
exports.getAllEvents = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  const { page = 1, limit = 20, eventType, visibility } = req.query;

  const query = { isActive: true };

  // Filter by visibility for non-admin users
  if (!user || (user.role !== "admin" && user.roleRef?.roleKey !== "admin")) {
    query["settings.visibility"] = "public";
  } else if (visibility) {
    query["settings.visibility"] = visibility;
  }

  // Filter by event type
  if (eventType) {
      query.eventType = eventType;
    }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  let events = await Event.find(query)
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  // Manually populate nested arrays using User model
  events = await Promise.all(
    events.map(async (event) => {
      const eventObj = event.toObject();
      
      // Populate likes.userId
      if (eventObj.likes && eventObj.likes.length > 0) {
        eventObj.likes = await Promise.all(
          eventObj.likes.map(async (like) => {
            if (like.userId) {
              try {
                const user = await User.findById(like.userId).select("firstName lastName");
                return { ...like, userId: user || like.userId };
              } catch (err) {
                return like;
              }
            }
            return like;
          })
        );
      }
      
      // Populate comments.userId
      if (eventObj.comments && eventObj.comments.length > 0) {
        eventObj.comments = await Promise.all(
          eventObj.comments.map(async (comment) => {
            if (comment.userId) {
              try {
                const user = await User.findById(comment.userId).select("firstName lastName profileImage");
                return { ...comment, userId: user || comment.userId };
              } catch (err) {
                return comment;
              }
            }
            return comment;
          })
        );
      }
      
      return eventObj;
    })
  );

  const total = await Event.countDocuments(query);

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
 * Get Single Event
 * GET /api/events/:id
 */
exports.getEventById = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const user = req.user;

  let event = await Event.findById(id)
    .populate("createdBy", "firstName lastName email");

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  if (!event.isActive) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check visibility for non-admin users (before converting to object)
  if (
    !user ||
    (user.role !== "admin" && user.roleRef?.roleKey !== "admin")
  ) {
    if (event.settings.visibility !== "public") {
      return next(new ErrorHandler("Event not found", 404));
    }
  }

  // Manually populate nested arrays
  const eventObj = event.toObject();
  
  // Populate likes.userId
  if (eventObj.likes && eventObj.likes.length > 0) {
    eventObj.likes = await Promise.all(
      eventObj.likes.map(async (like) => {
        if (like.userId && typeof like.userId === 'object' && like.userId.toString) {
          try {
            const user = await User.findById(like.userId).select("firstName lastName");
            return { ...like, userId: user || like.userId };
          } catch (err) {
            return like;
          }
        }
        return like;
      })
    );
  }

  // Populate comments.userId
  if (eventObj.comments && eventObj.comments.length > 0) {
    eventObj.comments = await Promise.all(
      eventObj.comments.map(async (comment) => {
        if (comment.userId && typeof comment.userId === 'object' && comment.userId.toString) {
          try {
            const user = await User.findById(comment.userId).select("firstName lastName profileImage");
            return { ...comment, userId: user || comment.userId };
          } catch (err) {
            return comment;
          }
        }
        return comment;
      })
    );
  }
  
  event = eventObj;

  res.status(200).json({
    success: true,
    data: event,
  });
});

/**
 * Update Event (Admin only)
 * PUT /api/events/:id
 */
exports.updateEvent = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  // Check if user exists
  if (!user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  // Check if user is admin
  if (user.role !== "admin" && user.roleRef?.roleKey !== "admin") {
    return next(new ErrorHandler("Only admins can update events", 403));
  }

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  const {
    title,
    description,
    eventType,
    startDate,
    endDate,
    media,
    settings,
    poll,
  } = req.body;

  // Update fields
  if (title) event.title = title;
  if (description !== undefined) event.description = description;
  if (eventType) event.eventType = eventType;
  if (startDate) event.startDate = startDate;
  if (endDate !== undefined) event.endDate = endDate;

  // Update media
  if (media) {
    if (media.images) event.media.images = media.images;
    if (media.files) event.media.files = media.files;
    if (media.youtubeUrl !== undefined) event.media.youtubeUrl = media.youtubeUrl;
    if (media.externalLink) event.media.externalLink = media.externalLink;
  }

  // Update settings
  if (settings) {
    if (settings.commentEnabled !== undefined)
      event.settings.commentEnabled = settings.commentEnabled;
    if (settings.pollEnabled !== undefined)
      event.settings.pollEnabled = settings.pollEnabled;
    if (settings.visibility) event.settings.visibility = settings.visibility;
  }

  // Update poll
  if (settings?.pollEnabled && poll) {
    if (poll.question) event.poll.question = poll.question;
    if (poll.options) {
      // If poll options changed, reset votes
      event.poll.options = poll.options.map((text) => ({
        text,
        votes: [],
        voteCount: 0,
      }));
    }
  } else if (settings?.pollEnabled === false) {
    // Disable poll
    event.poll = {
      question: "",
      options: [],
    };
  }

  await event.save();

  let updatedEvent = await Event.findById(id)
    .populate("createdBy", "firstName lastName email");

  if (!updatedEvent) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Manually populate nested arrays
  const User = require("../models/userModel");
  const eventObj = updatedEvent.toObject();
  
  // Populate likes.userId
  if (eventObj.likes && eventObj.likes.length > 0) {
    eventObj.likes = await Promise.all(
      eventObj.likes.map(async (like) => {
        if (like.userId && typeof like.userId === 'object' && like.userId.toString) {
          try {
            const user = await User.findById(like.userId).select("firstName lastName");
            return { ...like, userId: user || like.userId };
          } catch (err) {
            return like;
    }
        }
        return like;
      })
    );
  }
  
  // Populate comments.userId
  if (eventObj.comments && eventObj.comments.length > 0) {
    eventObj.comments = await Promise.all(
      eventObj.comments.map(async (comment) => {
        if (comment.userId && typeof comment.userId === 'object' && comment.userId.toString) {
          try {
            const user = await User.findById(comment.userId).select("firstName lastName profileImage");
            return { ...comment, userId: user || comment.userId };
          } catch (err) {
            return comment;
          }
        }
        return comment;
      })
    );
  }
  
  updatedEvent = eventObj;

  res.status(200).json({
    success: true,
    message: "Event updated successfully",
    data: updatedEvent,
  });
});

/**
 * Delete Event (Admin only)
 * DELETE /api/events/:id
 */
exports.deleteEvent = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  // Check if user exists
  if (!user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  // Check if user is admin
  if (user.role !== "admin" && user.roleRef?.roleKey !== "admin") {
    return next(new ErrorHandler("Only admins can delete events", 403));
  }

  const event = await Event.findById(id);

  if (!event) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Soft delete
  event.isActive = false;
  await event.save();

  res.status(200).json({
    success: true,
    message: "Event deleted successfully",
  });
});

/**
 * Like/Unlike Event
 * POST /api/events/:id/like
 */
exports.toggleLike = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;

  if (!user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  const event = await Event.findById(id);

  if (!event || !event.isActive) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check visibility
  if (
    event.settings.visibility !== "public" &&
    user.role !== "admin" &&
    user.roleRef?.roleKey !== "admin"
  ) {
    return next(new ErrorHandler("Event not found", 404));
  }

  const isLiked = event.addLike(user.id || user._id);
  await event.save();

  res.status(200).json({
    success: true,
    message: isLiked ? "Event liked" : "Event unliked",
    data: {
      likeCount: event.likeCount,
      isLiked,
    },
  });
});

/**
 * Add Comment
 * POST /api/events/:id/comment
 */
exports.addComment = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const { text } = req.body;

  if (!user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  if (!text || !text.trim()) {
    return next(new ErrorHandler("Comment text is required", 400));
  }

  const event = await Event.findById(id);

  if (!event || !event.isActive) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check if comments are enabled
  if (!event.settings.commentEnabled) {
    return next(new ErrorHandler("Comments are disabled for this event", 400));
  }

  // Check visibility
  if (
    event.settings.visibility !== "public" &&
    user.role !== "admin" &&
    user.roleRef?.roleKey !== "admin"
  ) {
    return next(new ErrorHandler("Event not found", 404));
  }

  const comment = event.addComment(user.id || user._id, text.trim());
  await event.save();

  const populatedEvent = await Event.findById(id)
    .populate("createdBy", "firstName lastName email");

  // Manually populate the new comment's userId
  const commentObj = comment.toObject ? comment.toObject() : comment;
  if (commentObj.userId) {
    try {
      const populatedUser = await User.findById(commentObj.userId).select("firstName lastName profileImage");
      commentObj.userId = populatedUser || commentObj.userId;
    } catch (err) {
      // Keep original userId if populate fails
    }
  }

  const newComment = commentObj;

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    data: newComment,
  });
});

/**
 * Delete Comment
 * DELETE /api/events/:id/comment/:commentId
 */
exports.deleteComment = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  const { id, commentId } = req.params;

  if (!user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  const event = await Event.findById(id);

  if (!event || !event.isActive) {
    return next(new ErrorHandler("Event not found", 404));
  }

  const isAdmin = user.role === "admin" || user.roleRef?.roleKey === "admin";

  try {
    event.deleteComment(commentId, user.id || user._id, isAdmin);
  await event.save();

  res.status(200).json({
    success: true,
      message: "Comment deleted successfully",
  });
  } catch (error) {
    return next(new ErrorHandler(error.message, 403));
  }
});

/**
 * Vote in Poll
 * POST /api/events/:id/vote
 */
exports.voteInPoll = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const { optionId } = req.body;

  if (!user) {
    return next(new ErrorHandler("Authentication required", 401));
  }

  if (!optionId) {
    return next(new ErrorHandler("Option ID is required", 400));
  }

  const event = await Event.findById(id);

  if (!event || !event.isActive) {
    return next(new ErrorHandler("Event not found", 404));
  }

  // Check if poll is enabled
  if (!event.settings.pollEnabled) {
    return next(new ErrorHandler("Poll is not enabled for this event", 400));
  }

  // Check visibility
  if (
    event.settings.visibility !== "public" &&
    user.role !== "admin" &&
    user.roleRef?.roleKey !== "admin"
  ) {
    return next(new ErrorHandler("Event not found", 404));
  }

  try {
    event.voteInPoll(user.id || user._id, optionId);
  await event.save();

    const updatedEvent = await Event.findById(id);

  res.status(200).json({
    success: true,
      message: "Vote recorded successfully",
      data: {
        poll: updatedEvent.poll,
        userVote: updatedEvent.getUserVote(user.id || user._id),
      },
  });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});


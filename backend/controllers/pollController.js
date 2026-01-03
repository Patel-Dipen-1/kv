const Poll = require("../models/pollModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

/**
 * Create new poll
 * POST /api/polls
 * Body can include eventId or leave null for standalone poll
 */
exports.createPoll = catchAsyncErrors(async (req, res, next) => {
  const { eventId } = req.body; // Get from body instead of params
  const userId = req.user.id;
  const user = req.user;

  // Check permission
  if (!user.roleRef?.permissions?.canCreatePolls) {
    return next(new ErrorHandler("You don't have permission to create polls", 403));
  }

  // Event functionality removed - polls are now standalone only

  const {
    question,
    description,
    pollType,
    options,
    allowAnonymous,
    showLiveResults,
    allowVoteChanges,
    maxVotesPerUser,
    startDate,
    endDate,
    restrictTo,
    restrictedSamaj,
    restrictedRoles,
    restrictedFamilies,
  } = req.body;

  // Validate options
  if (!options || options.length < 2 || options.length > 10) {
    return next(
      new ErrorHandler("Poll must have between 2 and 10 options", 400)
    );
  }

  // Validate end date
  if (new Date(endDate) <= new Date()) {
    return next(new ErrorHandler("End date must be in the future", 400));
  }

  // Set max votes based on poll type
  let maxVotes = maxVotesPerUser || 1;
  if (pollType === "multiple_choice") {
    maxVotes = maxVotesPerUser || options.length;
  }

  const pollData = {
    question,
    description,
    pollType: pollType || "single_choice",
    options: options.map((opt, index) => ({
      optionText: opt,
      order: index,
    })),
    allowAnonymous: allowAnonymous || false,
    showLiveResults: showLiveResults !== false, // Default true
    allowVoteChanges: allowVoteChanges || false,
    maxVotesPerUser: maxVotes,
    startDate: startDate ? new Date(startDate) : new Date(),
    endDate: new Date(endDate),
    restrictTo: restrictTo || "all",
    restrictedSamaj: restrictedSamaj || [],
    restrictedRoles: restrictedRoles || [],
    restrictedFamilies: restrictedFamilies || [],
    createdBy: userId,
  };

  const poll = await Poll.create(pollData);

  res.status(201).json({
    success: true,
    message: "Poll created successfully",
    data: poll,
  });
});

/**
 * Get polls for an event (deprecated - events removed, returns all polls)
 * GET /api/polls/event/:eventId
 */
exports.getPollsByEvent = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;

  // Event functionality removed - return all polls
  const query = {
    isActive: true,
    status: { $in: ["active", "closed"] },
  };

  const polls = await Poll.find(query)
    .populate("createdBy", "firstName lastName")
    .sort({ createdAt: -1 });

  // Filter by access control
  const accessiblePolls = user
    ? polls.filter((poll) => poll.canUserVote(user) || poll.status === "closed")
    : polls.filter((poll) => poll.restrictTo === "all" || poll.allowAnonymous);

  res.status(200).json({
    success: true,
    count: accessiblePolls.length,
    data: accessiblePolls,
  });
});

/**
 * Get single poll by ID
 * GET /api/polls/:pollId
 */
exports.getPollById = catchAsyncErrors(async (req, res, next) => {
  const { pollId } = req.params;
  const user = req.user;

  const poll = await Poll.findById(pollId)
    .populate("createdBy", "firstName lastName")
    .populate("options.voters", "firstName lastName");

  if (!poll) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // Check if user can view (even if closed, they can see results)
  if (poll.status === "active" && !poll.canUserVote(user) && !user) {
    return next(new ErrorHandler("You don't have permission to view this poll", 403));
  }

  // Calculate percentages for each option
  const pollData = poll.toObject();
  pollData.options = pollData.options.map((option) => {
    const percentage =
      poll.totalVotes > 0 ? ((option.voteCount / poll.totalVotes) * 100).toFixed(1) : 0;
    return {
      ...option,
      percentage: parseFloat(percentage),
    };
  });

  // Find winner (highest votes)
  if (pollData.totalVotes > 0) {
    const winner = pollData.options.reduce((prev, current) =>
      prev.voteCount > current.voteCount ? prev : current
    );
    pollData.winner = winner;
  }

  // Check if user has voted
  if (user) {
    pollData.userHasVoted = poll.hasUserVoted(user.id);
    pollData.userVote = poll.getUserVote(user.id);
  }

  res.status(200).json({
    success: true,
    data: pollData,
  });
});

/**
 * Vote on poll
 * POST /api/polls/:pollId/vote
 */
exports.voteOnPoll = catchAsyncErrors(async (req, res, next) => {
  const { pollId } = req.params;
  const userId = req.user?.id;
  const { optionIds } = req.body; // Array of option IDs for multi-choice

  const poll = await Poll.findById(pollId);

  if (!poll) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // Check if poll is active
  if (poll.status !== "active") {
    return next(new ErrorHandler("Poll is not active", 400));
  }

  // Check if user can vote
  if (!poll.canUserVote(req.user)) {
    return next(new ErrorHandler("You don't have permission to vote in this poll", 403));
  }

  // Check if user already voted
  if (userId && poll.hasUserVoted(userId) && !poll.allowVoteChanges) {
    return next(new ErrorHandler("You have already voted in this poll", 400));
  }

  // Validate option IDs
  if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
    return next(new ErrorHandler("Please select at least one option", 400));
  }

  // Check max votes
  if (optionIds.length > poll.maxVotesPerUser) {
    return next(
      new ErrorHandler(
        `You can only select up to ${poll.maxVotesPerUser} option(s)`,
        400
      )
    );
  }

  // If user already voted and changes allowed, remove previous votes
  if (userId && poll.hasUserVoted(userId) && poll.allowVoteChanges) {
    poll.options.forEach((option) => {
      const index = option.voters.findIndex(
        (voterId) => voterId.toString() === userId
      );
      if (index !== -1) {
        option.voters.splice(index, 1);
        option.voteCount = Math.max(0, option.voteCount - 1);
      }
    });
  }

  // Add new votes
  optionIds.forEach((optionId) => {
    const option = poll.options.id(optionId);
    if (option) {
      option.voteCount += 1;
      if (userId) {
        option.voters.push(userId);
      }
    }
  });

  // Update total votes
  poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);

  await poll.save();

  res.status(200).json({
    success: true,
    message: "Vote recorded successfully",
    data: {
      pollId: poll._id,
      totalVotes: poll.totalVotes,
      userVote: optionIds,
    },
  });
});

/**
 * Change vote (if allowed)
 * PATCH /api/polls/:pollId/vote
 */
exports.changeVote = catchAsyncErrors(async (req, res, next) => {
  const { pollId } = req.params;
  const userId = req.user.id;
  const { optionIds } = req.body;

  const poll = await Poll.findById(pollId);

  if (!poll) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  if (!poll.allowVoteChanges) {
    return next(new ErrorHandler("Vote changes are not allowed for this poll", 400));
  }

  if (poll.status !== "active") {
    return next(new ErrorHandler("Poll is not active", 400));
  }

  // Remove previous votes
  poll.options.forEach((option) => {
    const index = option.voters.findIndex(
      (voterId) => voterId.toString() === userId
    );
    if (index !== -1) {
      option.voters.splice(index, 1);
      option.voteCount = Math.max(0, option.voteCount - 1);
    }
  });

  // Add new votes
  if (optionIds && Array.isArray(optionIds) && optionIds.length > 0) {
    optionIds.forEach((optionId) => {
      const option = poll.options.id(optionId);
      if (option) {
        option.voteCount += 1;
        option.voters.push(userId);
      }
    });
  }

  poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  await poll.save();

  res.status(200).json({
    success: true,
    message: "Vote changed successfully",
    data: {
      pollId: poll._id,
      totalVotes: poll.totalVotes,
      userVote: optionIds,
    },
  });
});

/**
 * Close poll early (creator or admin)
 * PATCH /api/polls/:pollId/close
 */
exports.closePoll = catchAsyncErrors(async (req, res, next) => {
  const { pollId } = req.params;
  const userId = req.user.id;
  const user = req.user;

  const poll = await Poll.findById(pollId);

  if (!poll) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // Check permission: creator or admin
  const isCreator = poll.createdBy.toString() === userId;
  const isAdmin = user.roleRef?.permissions?.canManagePolls === true;

  if (!isCreator && !isAdmin) {
    return next(
      new ErrorHandler("You don't have permission to close this poll", 403)
    );
  }

  poll.status = "closed";
  await poll.save();

  res.status(200).json({
    success: true,
    message: "Poll closed successfully",
    data: poll,
  });
});

/**
 * Delete poll (admin only)
 * DELETE /api/polls/:pollId
 */
exports.deletePoll = catchAsyncErrors(async (req, res, next) => {
  const { pollId } = req.params;
  const userId = req.user.id;
  const user = req.user;

  const poll = await Poll.findById(pollId);

  if (!poll) {
    return next(new ErrorHandler("Poll not found", 404));
  }

  // Check permission: creator or admin
  const isCreator = poll.createdBy.toString() === userId;
  const isAdmin = user.roleRef?.permissions?.canManagePolls === true;

  if (!isCreator && !isAdmin) {
    return next(
      new ErrorHandler("You don't have permission to delete this poll", 403)
    );
  }

  // Event functionality removed

  // Soft delete
  poll.isActive = false;
  poll.status = "cancelled";
  await poll.save();

  res.status(200).json({
    success: true,
    message: "Poll deleted successfully",
  });
});


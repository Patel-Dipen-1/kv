const FamilyMemberRequest = require("../models/familyMemberRequestModel");
const FamilyMember = require("../models/familyMemberModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { logActivity } = require("../utils/activityLogger");
const crypto = require("crypto");

/**
 * Create family member request
 * POST /api/family-member-requests
 */
exports.createFamilyMemberRequest = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  // Get user's details
  const user = await User.findById(userId);
  if (!user || !user.subFamilyNumber) {
    return next(
      new ErrorHandler("User not found or subFamilyNumber not set", 404)
    );
  }

  // Calculate age from dateOfBirth if provided
  let age = req.body.age;
  if (req.body.dateOfBirth && !age) {
    const dob = new Date(req.body.dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }
  }

  // Format mobile number if provided
  let mobileNumber = req.body.mobileNumber;
  if (mobileNumber) {
    const cleanedMobile = mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
    if (/^\d{10}$/.test(cleanedMobile)) {
      mobileNumber = `+91${cleanedMobile}`;
    } else {
      mobileNumber = null;
    }
  }

  const email = req.body.email ? req.body.email.toLowerCase().trim() : undefined;

  // Create request
  const requestData = {
    requestedBy: userId,
    subFamilyNumber: user.subFamilyNumber,
    relationshipToUser: req.body.relationshipToUser,
    firstName: req.body.firstName,
    middleName: req.body.middleName,
    lastName: req.body.lastName,
    dateOfBirth: req.body.dateOfBirth,
    age: age,
    bloodGroup: req.body.bloodGroup || "Unknown",
    mobileNumber: mobileNumber,
    email: email,
    address: req.body.address,
    maritalStatus: req.body.maritalStatus,
    occupationType: req.body.occupationType,
    occupationTitle: req.body.occupationTitle,
    qualification: req.body.qualification,
    profileImage: req.body.profileImage,
    createLoginAccount: req.body.createLoginAccount === true,
    password: req.body.password,
    useMobileAsPassword: req.body.useMobileAsPassword === true,
    requestReason: req.body.requestReason,
    status: "pending",
  };

  const request = await FamilyMemberRequest.create(requestData);

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: userId,
    actionType: "family_member_request_created",
    details: {
      requestId: request._id,
      familyMemberName: `${req.body.firstName} ${req.body.lastName}`,
    },
    description: `Request to add family member: ${req.body.firstName} ${req.body.lastName}`,
    ipAddress,
  });

  res.status(201).json({
    success: true,
    message: "Family member request submitted successfully. Waiting for admin approval.",
    data: request,
  });
});

/**
 * Get all family member requests (Admin only)
 * GET /api/admin/family-member-requests
 */
exports.getAllFamilyMemberRequests = catchAsyncErrors(async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) {
    query.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const requests = await FamilyMemberRequest.find(query)
    .populate("requestedBy", "firstName lastName email mobileNumber")
    .populate("reviewedBy", "firstName lastName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await FamilyMemberRequest.countDocuments(query);

  res.status(200).json({
    success: true,
    count: requests.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: requests,
  });
});

/**
 * Get user's own family member requests
 * GET /api/family-member-requests
 */
exports.getMyFamilyMemberRequests = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const requests = await FamilyMemberRequest.find({ requestedBy: userId })
    .populate("reviewedBy", "firstName lastName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: requests.length,
    data: requests,
  });
});

/**
 * Approve family member request (Admin only)
 * PATCH /api/admin/family-member-requests/:id/approve
 */
exports.approveFamilyMemberRequest = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const adminId = req.user.id;

  const request = await FamilyMemberRequest.findById(id).populate("requestedBy");
  if (!request) {
    return next(new ErrorHandler("Family member request not found", 404));
  }

  if (request.status !== "pending") {
    return next(
      new ErrorHandler(
        `Request is already ${request.status}. Cannot approve.`,
        400
      )
    );
  }

  // Get the requester's user details to find primary account holder
  const requester = await User.findById(request.requestedBy);
  if (!requester) {
    return next(new ErrorHandler("Requester not found", 404));
  }

  // Find primary account holder for this family
  const primaryAccount = await User.findOne({
    subFamilyNumber: request.subFamilyNumber,
    isPrimaryAccount: true,
  });

  if (!primaryAccount) {
    return next(
      new ErrorHandler(
        "Primary account holder not found for this family",
        404
      )
    );
  }

  // Count existing family members to determine if approval is needed
  const count = await FamilyMember.countDocuments({
    subFamilyNumber: request.subFamilyNumber,
    approvalStatus: { $in: ["approved", "pending"] },
  });

  const needsApproval = count >= 5;
  const approvalStatus = needsApproval ? "pending" : "approved";

  // Create family member
  const familyMemberData = {
    userId: primaryAccount._id, // Link to primary account holder
    subFamilyNumber: request.subFamilyNumber,
    relationshipToUser: request.relationshipToUser,
    firstName: request.firstName,
    middleName: request.middleName,
    lastName: request.lastName,
    dateOfBirth: request.dateOfBirth,
    age: request.age,
    bloodGroup: request.bloodGroup,
    mobileNumber: request.mobileNumber,
    email: request.email,
    address: request.address,
    maritalStatus: request.maritalStatus,
    occupationType: request.occupationType,
    occupationTitle: request.occupationTitle,
    qualification: request.qualification,
    profileImage: request.profileImage,
    needsApproval: needsApproval,
    approvalStatus: approvalStatus,
    hasUserAccount: request.createLoginAccount,
  };

  let familyMemberUser = null;

  // If creating login account
  if (request.createLoginAccount) {
    if (!request.mobileNumber && !request.email) {
      return next(
        new ErrorHandler(
          "Email or mobile number is required to create a login account",
          400
        )
      );
    }

    // Check if user already exists
    let existingUser = null;
    if (request.mobileNumber) {
      existingUser = await User.findOne({
        mobileNumber: request.mobileNumber,
        status: { $in: ["pending", "approved"] },
        isActive: true,
        deletedAt: null,
      });
    }
    if (!existingUser && request.email) {
      existingUser = await User.findOne({
        email: request.email,
        status: { $in: ["pending", "approved"] },
        isActive: true,
        deletedAt: null,
      });
    }

    if (existingUser) {
      familyMemberUser = existingUser;
      familyMemberData.linkedUserId = existingUser._id;
    } else {
      // Create new user account
      const Role = require("../models/roleModel");
      const defaultUserRole = await Role.findOne({ roleKey: "user" });

      const cleanedMobile = request.mobileNumber
        ? request.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "")
        : null;

      const defaultPassword =
        request.password ||
        (request.useMobileAsPassword && cleanedMobile
          ? cleanedMobile
          : cleanedMobile || request.email?.split("@")[0] || "12345678");

      const userEmail = request.email || `family.${cleanedMobile}@${request.subFamilyNumber}.family.local`;

      familyMemberUser = await User.create({
        firstName: request.firstName,
        middleName: request.middleName,
        lastName: request.lastName,
        email: userEmail,
        mobileNumber: request.mobileNumber || `+919${crypto.createHash("md5").update(userEmail).digest("hex").substring(0, 9)}`,
        password: defaultPassword,
        subFamilyNumber: request.subFamilyNumber,
        isPrimaryAccount: false,
        status: "approved",
        roleRef: defaultUserRole?._id,
        linkedFamilyMemberId: null, // Will be set after family member creation
      });

      familyMemberData.linkedUserId = familyMemberUser._id;
    }
  }

  // Create family member
  const familyMember = await FamilyMember.create(familyMemberData);

  // Link user to family member if created
  if (familyMemberUser && !familyMemberUser.linkedFamilyMemberId) {
    familyMemberUser.linkedFamilyMemberId = familyMember._id;
    await familyMemberUser.save();
  }

  // Update request status
  request.status = "approved";
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  await request.save();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: adminId,
    actionType: "family_member_request_approved",
    targetUser: request.requestedBy,
    details: {
      requestId: request._id,
      familyMemberId: familyMember._id,
      familyMemberName: `${request.firstName} ${request.lastName}`,
    },
    description: `Approved family member request: ${request.firstName} ${request.lastName}`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Family member request approved and family member added successfully",
    data: {
      request,
      familyMember,
    },
  });
});

/**
 * Reject family member request (Admin only)
 * PATCH /api/admin/family-member-requests/:id/reject
 */
exports.rejectFamilyMemberRequest = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { rejectionReason } = req.body || {};
  const adminId = req.user.id;

  const request = await FamilyMemberRequest.findById(id);
  if (!request) {
    return next(new ErrorHandler("Family member request not found", 404));
  }

  if (request.status !== "pending") {
    return next(
      new ErrorHandler(
        `Request is already ${request.status}. Cannot reject.`,
        400
      )
    );
  }

  // Update request status
  request.status = "rejected";
  request.reviewedBy = adminId;
  request.reviewedAt = new Date();
  request.rejectionReason = rejectionReason || "";
  await request.save();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: adminId,
    actionType: "family_member_request_rejected",
    targetUser: request.requestedBy,
    details: {
      requestId: request._id,
      rejectionReason: rejectionReason || "",
    },
    description: `Rejected family member request: ${request.firstName} ${request.lastName}`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Family member request rejected",
    data: request,
  });
});


const FamilyMember = require("../models/familyMemberModel");
const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { logActivity } = require("../utils/activityLogger");

/**
 * Add family member (authenticated user)
 * POST /api/family-members
 */
exports.addFamilyMember = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  // Get user's details
  const user = await User.findById(userId).populate("roleRef");
  if (!user || !user.subFamilyNumber) {
    return next(
      new ErrorHandler("User not found or subFamilyNumber not set", 404)
    );
  }

  // Check if user has permission to add family members
  // Rule: Primary account OR family member with canManageFamilyMembers permission
  const isPrimaryAccount = user.isPrimaryAccount === true;
  const hasManagePermission = user.roleRef?.permissions?.canManageFamilyMembers === true;

  if (!isPrimaryAccount && !hasManagePermission) {
    return next(
      new ErrorHandler(
        "You don't have permission to add family members. Please use the request system or contact admin.",
        403
      )
    );
  }

  // If user is a family member (not primary), they cannot create login accounts for others
  if (!isPrimaryAccount && req.body.createLoginAccount === true) {
    return next(
      new ErrorHandler(
        "Family member accounts cannot create login accounts for others. Please contact admin.",
        403
      )
    );
  }

  // Count existing approved/pending family members for this family (by subFamilyNumber)
  const count = await FamilyMember.countDocuments({
    subFamilyNumber: user.subFamilyNumber,
    approvalStatus: { $in: ["approved", "pending"] },
  });

  // Determine if approval is needed (6+ members need approval)
  const needsApproval = count >= 5;
  const approvalStatus = needsApproval ? "pending" : "approved";

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
  let cleanedMobile = null;
  if (mobileNumber) {
    cleanedMobile = mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
    if (/^\d{10}$/.test(cleanedMobile)) {
      mobileNumber = `+91${cleanedMobile}`;
    } else {
      mobileNumber = null; // Invalid mobile number
    }
  }

  const email = req.body.email ? req.body.email.toLowerCase().trim() : undefined;

  // Check if user wants to create login account for this family member
  const createLoginAccount = req.body.createLoginAccount === true || req.body.createLoginAccount === "true";
  
  // If createLoginAccount is checked, email or mobile is required
  if (createLoginAccount && !email && !mobileNumber) {
    return next(
      new ErrorHandler("Email or mobile number is required to create a login account", 400)
    );
  }

  // If family member has mobile number or email, and createLoginAccount is checked, create a User account for them
  let familyMemberUser = null;
  if (createLoginAccount && (mobileNumber || email)) {
    // Prepare email and mobile for user lookup/creation
    let userEmail = email;
    let userMobile = mobileNumber;
    
    // Generate placeholder email if only mobile provided
    if (mobileNumber && !email) {
      userEmail = `family.${cleanedMobile}@${user.subFamilyNumber}.family.local`;
    }
    
    // Generate placeholder mobile if only email provided
    if (email && !mobileNumber) {
      const crypto = require("crypto");
      const emailHash = crypto.createHash("md5").update(email).digest("hex").substring(0, 9);
      userMobile = `+919${emailHash}`;
    }
    
    // Check if user with this mobile/email already exists
    let existingUser = null;
    if (userMobile && userEmail) {
      // Check both mobile and email
      existingUser = await User.findOne({
        $or: [
          { mobileNumber: userMobile },
          { email: userEmail }
        ]
      });
    } else if (userMobile) {
      existingUser = await User.findOne({ mobileNumber: userMobile });
    } else if (userEmail) {
      existingUser = await User.findOne({ email: userEmail });
    }
    
    if (existingUser) {
      // User already exists, link to existing user
      familyMemberUser = existingUser;
    } else {
      // Create new User account for family member
      // Use provided password, or mobile number as default, or email prefix, or default password
      const providedPassword = req.body.password;
      const useMobileAsPassword = req.body.useMobileAsPassword === true || req.body.useMobileAsPassword === "true";
      const defaultPassword = providedPassword 
        ? providedPassword 
        : useMobileAsPassword && cleanedMobile 
          ? cleanedMobile 
          : cleanedMobile || email?.split("@")[0] || "12345678";
      
      // Find default "User" role to assign
      const Role = require("../models/roleModel");
      const defaultUserRole = await Role.findOne({ roleKey: "user" });
      
      // Create family member first to get its ID for linking
      const familyMemberData = {
        userId: userId,
        subFamilyNumber: user.subFamilyNumber,
        relationshipToUser: req.body.relationshipToUser,
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        age: age,
        mobileNumber: mobileNumber,
        email: email,
        bloodGroup: req.body.bloodGroup || "Unknown",
        maritalStatus: req.body.maritalStatus,
        occupationType: req.body.occupationType,
        occupationTitle: req.body.occupationTitle,
        qualification: req.body.qualification,
        profileImage: req.body.profileImage,
        needsApproval: needsApproval,
        approvalStatus: approvalStatus,
        hasUserAccount: true, // Will be set after user creation
      };
      
      // Create family member temporarily (we'll update it after user creation)
      const tempFamilyMember = await FamilyMember.create(familyMemberData);
      
      familyMemberUser = await User.create({
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        mobileNumber: userMobile,
        email: userEmail,
        password: defaultPassword,
        address: user.address || {
          line1: "Family Member",
          city: user.address?.city || "",
          state: user.address?.state || "",
          country: user.address?.country || "India",
          pincode: user.address?.pincode || "",
        },
        age: age,
        dateOfBirth: req.body.dateOfBirth,
        bloodGroup: req.body.bloodGroup || "Unknown",
        occupationType: req.body.occupationType || "other",
        occupationTitle: req.body.occupationTitle,
        companyOrBusinessName: req.body.companyOrBusinessName,
        position: req.body.position,
        qualification: req.body.qualification,
        maritalStatus: req.body.maritalStatus || "single",
        profileImage: req.body.profileImage,
        samaj: user.samaj,
        subFamilyNumber: user.subFamilyNumber, // Same as family head
        isPrimaryAccount: false, // Family member accounts are not primary
        status: "approved", // Family members are auto-approved
        role: "user",
        roleRef: defaultUserRole?._id,
        isActive: true,
        linkedFamilyMemberId: tempFamilyMember._id, // Link back to family member
      });
      
      // Update family member with linked user ID
      tempFamilyMember.linkedUserId = familyMemberUser._id;
      await tempFamilyMember.save();
    }
  }

  // Create family member (if not already created above)
  let familyMember;
  if (familyMemberUser && familyMemberUser.linkedFamilyMemberId) {
    // Family member was already created above, fetch it
    familyMember = await FamilyMember.findById(familyMemberUser.linkedFamilyMemberId);
  } else {
    // Create family member without user account
    familyMember = await FamilyMember.create({
      userId: userId,
      subFamilyNumber: user.subFamilyNumber,
      relationshipToUser: req.body.relationshipToUser,
      firstName: req.body.firstName,
      middleName: req.body.middleName,
      lastName: req.body.lastName,
      dateOfBirth: req.body.dateOfBirth,
      age: age,
      mobileNumber: mobileNumber,
      email: email,
      bloodGroup: req.body.bloodGroup || "Unknown",
      maritalStatus: req.body.maritalStatus,
      occupationType: req.body.occupationType,
      occupationTitle: req.body.occupationTitle,
      qualification: req.body.qualification,
      profileImage: req.body.profileImage,
      needsApproval: needsApproval,
      approvalStatus: approvalStatus,
      hasUserAccount: false,
    });
  }

  // Update user's familyMembers array and count
  await User.findByIdAndUpdate(userId, {
    $push: { familyMembers: familyMember._id },
    $inc: { familyMembersCount: 1 },
  });

  const message = needsApproval
    ? "Family member added. Waiting for admin approval (you have 5+ members)."
    : "Family member added successfully.";

  // If user account was created, add info about login
  let loginInfo = null;
  if (familyMemberUser && createLoginAccount) {
    const actualLoginMethod = email ? "email" : mobileNumber ? "mobile number" : null;
    const providedPassword = req.body.password;
    const useMobileAsPassword = req.body.useMobileAsPassword === true || req.body.useMobileAsPassword === "true";
    
    loginInfo = {
      canLogin: true,
      loginWith: actualLoginMethod,
      email: email,
      mobileNumber: mobileNumber,
      passwordSet: !!providedPassword,
      useMobileAsPassword: useMobileAsPassword,
      message: email 
        ? `Login account created! Username: ${email}. ${providedPassword ? "Password: the one you set." : useMobileAsPassword && cleanedMobile ? `Default password: ${cleanedMobile} (mobile number).` : `Default password: ${email.split("@")[0]}.`} They will receive login details via email/mobile.`
        : mobileNumber
        ? `Login account created! Username: ${mobileNumber}. ${providedPassword ? "Password: the one you set." : `Default password: ${cleanedMobile} (mobile number).`} They will receive login details via mobile.`
        : null,
    };
  }

  res.status(201).json({
    success: true,
    message: message,
    data: familyMember,
    needsApproval: needsApproval,
    loginInfo: loginInfo,
  });
});

/**
 * Get my family members (authenticated user)
 * GET /api/family-members/my
 */
exports.getMyFamilyMembers = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  const familyMembers = await FamilyMember.find({
    userId: userId,
    approvalStatus: "approved", // Only show approved members to normal users
    isActive: true,
  })
    .sort({ relationshipToUser: 1, createdAt: 1 })
    .select("-__v");

  res.status(200).json({
    success: true,
    count: familyMembers.length,
    data: familyMembers,
  });
});

/**
 * Update family member (authenticated user, only their own)
 * PATCH /api/family-members/:id
 */
exports.updateFamilyMember = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const familyMember = await FamilyMember.findById(id);

  if (!familyMember) {
    return next(new ErrorHandler("Family member not found", 404));
  }

  // Check ownership
  if (familyMember.userId.toString() !== userId) {
    return next(
      new ErrorHandler("You can only update your own family members", 403)
    );
  }

  // Calculate age from dateOfBirth if provided
  if (req.body.dateOfBirth) {
    const dob = new Date(req.body.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }
    req.body.age = age;
  }

  // Format mobile number if provided
  if (req.body.mobileNumber) {
    const cleaned = req.body.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
    if (/^\d{10}$/.test(cleaned)) {
      req.body.mobileNumber = `+91${cleaned}`;
    }
  }

  // Format email if provided
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase();
  }

  // Update allowed fields (not approvalStatus, needsApproval)
  const allowedFields = [
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "age",
    "mobileNumber",
    "email",
    "maritalStatus",
    "occupationType",
    "occupationTitle",
    "qualification",
    "profileImage",
    "relationshipToUser",
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedMember = await FamilyMember.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    success: true,
    message: "Family member updated successfully",
    data: updatedMember,
  });
});

/**
 * Delete family member (authenticated user, only their own)
 * DELETE /api/family-members/:id
 */
exports.deleteFamilyMember = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const familyMember = await FamilyMember.findById(id);

  if (!familyMember) {
    return next(new ErrorHandler("Family member not found", 404));
  }

  // Check ownership
  if (familyMember.userId.toString() !== userId) {
    return next(
      new ErrorHandler("You can only delete your own family members", 403)
    );
  }

  // Delete family member
  await FamilyMember.findByIdAndDelete(id);

  // Update user's familyMembers array and count
  await User.findByIdAndUpdate(userId, {
    $pull: { familyMembers: id },
    $inc: { familyMembersCount: -1 },
  });

  res.status(200).json({
    success: true,
    message: "Family member deleted successfully",
  });
});

/**
 * Get pending family members (admin only)
 * GET /api/family-members/pending
 */
exports.getPendingFamilyMembers = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {
    needsApproval: true,
    approvalStatus: "pending",
  };

  const total = await FamilyMember.countDocuments(query);

  const pendingMembers = await FamilyMember.find(query)
    .populate("userId", "firstName lastName email subFamilyNumber")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select("-__v");

  res.status(200).json({
    success: true,
    count: pendingMembers.length,
    total: total,
    page: page,
    pages: Math.ceil(total / limit),
    data: pendingMembers,
  });
});

/**
 * Approve family member (admin only)
 * PATCH /api/family-members/:id/approve
 */
exports.approveFamilyMember = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const familyMember = await FamilyMember.findById(id);

  if (!familyMember) {
    return next(new ErrorHandler("Family member not found", 404));
  }

  familyMember.approvalStatus = "approved";
  await familyMember.save();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "family_member_approved",
    targetUser: familyMember.userId,
    targetFamilyMember: id,
    details: {
      familyMemberName: `${familyMember.firstName} ${familyMember.lastName}`,
      relationship: familyMember.relationshipToUser,
    },
    description: `Family member ${familyMember.firstName} ${familyMember.lastName} (${familyMember.relationshipToUser}) approved`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Family member approved successfully",
    data: familyMember,
  });
});

/**
 * Reject family member (admin only)
 * PATCH /api/family-members/:id/reject
 */
exports.rejectFamilyMember = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const familyMember = await FamilyMember.findById(id);

  if (!familyMember) {
    return next(new ErrorHandler("Family member not found", 404));
  }

  familyMember.approvalStatus = "rejected";
  await familyMember.save();

  // Remove from user's familyMembers array and decrement count
  await User.findByIdAndUpdate(familyMember.userId, {
    $pull: { familyMembers: id },
    $inc: { familyMembersCount: -1 },
  });

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "family_member_rejected",
    targetUser: familyMember.userId,
    targetFamilyMember: id,
    details: {
      familyMemberName: `${familyMember.firstName} ${familyMember.lastName}`,
      relationship: familyMember.relationshipToUser,
    },
    description: `Family member ${familyMember.firstName} ${familyMember.lastName} (${familyMember.relationshipToUser}) rejected`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Family member rejected successfully",
  });
});

/**
 * Get all family members by sub family number (admin/moderator)
 * GET /api/family-members/sub-family/:subFamilyNumber
 */
exports.getAllFamilyMembersBySubFamily = catchAsyncErrors(
  async (req, res, next) => {
    const { subFamilyNumber } = req.params;

    // Get main user
    const user = await User.findOne({ subFamilyNumber: subFamilyNumber })
      .select("firstName lastName email mobileNumber subFamilyNumber")
      .lean();

    if (!user) {
      return next(
        new ErrorHandler("User with this family number not found", 404)
      );
    }

    // Get all family members
    const familyMembers = await FamilyMember.find({
      subFamilyNumber: subFamilyNumber,
      approvalStatus: "approved",
      isActive: true,
    })
      .sort({ relationshipToUser: 1, createdAt: 1 })
      .select("-__v")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        mainUser: user,
        familyMembers: familyMembers,
        totalMembers: familyMembers.length + 1, // +1 for main user
      },
    });
  }
);

/**
 * Update family member (Admin only - can update any family member)
 * PATCH /api/admin/family-members/:id
 */
exports.adminUpdateFamilyMember = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const familyMember = await FamilyMember.findById(id);

  if (!familyMember) {
    return next(new ErrorHandler("Family member not found", 404));
  }

  // Calculate age from dateOfBirth if provided
  if (req.body.dateOfBirth) {
    const dob = new Date(req.body.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dob.getDate())
    ) {
      age--;
    }
    req.body.age = age;
  }

  // Format mobile number if provided
  if (req.body.mobileNumber) {
    const cleaned = req.body.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
    if (/^\d{10}$/.test(cleaned)) {
      req.body.mobileNumber = `+91${cleaned}`;
    } else {
      return next(new ErrorHandler("Invalid mobile number format", 400));
    }
  }

  // Format email if provided
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }

  // Update allowed fields (admin can also update approvalStatus)
  const allowedFields = [
    "firstName",
    "middleName",
    "lastName",
    "dateOfBirth",
    "age",
    "mobileNumber",
    "email",
    "maritalStatus",
    "occupationType",
    "occupationTitle",
    "qualification",
    "profileImage",
    "relationshipToUser",
    "approvalStatus", // Admin can update approval status
  ];

  const updateData = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  });

  const updatedMember = await FamilyMember.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("userId", "firstName lastName email subFamilyNumber")
    .lean();

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "family_member_updated",
    targetUser: familyMember.userId,
    targetFamilyMember: id,
    details: {
      familyMemberName: `${updatedMember.firstName} ${updatedMember.lastName}`,
      updatedFields: Object.keys(updateData),
    },
    description: `Family member ${updatedMember.firstName} ${updatedMember.lastName} updated by admin`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Family member updated successfully",
    data: updatedMember,
  });
});

/**
 * Delete family member (Admin only - can delete any family member)
 * DELETE /api/admin/family-members/:id
 */
exports.adminDeleteFamilyMember = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const familyMember = await FamilyMember.findById(id);

  if (!familyMember) {
    return next(new ErrorHandler("Family member not found", 404));
  }

  const familyMemberData = {
    name: `${familyMember.firstName} ${familyMember.lastName}`,
    userId: familyMember.userId,
  };

  // Delete family member
  await FamilyMember.findByIdAndDelete(id);

  // Update user's familyMembers array and count if exists
  await User.findByIdAndUpdate(familyMember.userId, {
    $pull: { familyMembers: id },
    $inc: { familyMembersCount: -1 },
  });

  // Log activity
  const ipAddress = req.ip || req.connection.remoteAddress;
  await logActivity({
    performedBy: req.user.id,
    actionType: "family_member_deleted",
    targetUser: familyMember.userId,
    targetFamilyMember: id,
    details: {
      familyMemberName: familyMemberData.name,
    },
    description: `Family member ${familyMemberData.name} deleted by admin`,
    ipAddress,
  });

  res.status(200).json({
    success: true,
    message: "Family member deleted successfully",
  });
});


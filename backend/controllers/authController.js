const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorhander");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const crypto = require("crypto");

/**
 * Register a new user
 * POST /api/auth/register
 */
exports.register = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    middleName,
    lastName,
    address,
    age,
    dateOfBirth,
    mobileNumber,
    email,
    occupationType,
    occupationTitle,
    companyOrBusinessName,
    position,
    qualification,
    maritalStatus,
    samaj,
    profileImage,
    subFamilyNumber,
    password,
  } = req.body;

  // Normalize email to lowercase for comparison
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists (case-insensitive) - only for active/pending/approved users
  // Exclude rejected and deleted users so their email/phone can be reused
  const existingEmail = await User.findOne({
    email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") },
    status: { $in: ["pending", "approved"] },
    isActive: true,
    deletedAt: null,
  });
  if (existingEmail) {
    return next(
      new ErrorHandler(
        `Email ${normalizedEmail} is already registered. Please use a different email.`,
        409
      )
    );
  }

  // Format mobile number for comparison
  const cleanedMobile = mobileNumber.replace(/^\+91/, "").replace(/\s/g, "").trim();
  if (!/^\d{10}$/.test(cleanedMobile)) {
    return next(new ErrorHandler("Invalid mobile number format", 400));
  }
  const formattedMobile = `+91${cleanedMobile}`;

  // Check if mobile number already exists - only for active/pending/approved users
  // Exclude rejected and deleted users so their email/phone can be reused
  const existingMobile = await User.findOne({
    mobileNumber: formattedMobile,
    status: { $in: ["pending", "approved"] },
    isActive: true,
    deletedAt: null,
  });
  if (existingMobile) {
    return next(
      new ErrorHandler(
        `Mobile number ${formattedMobile} is already registered. Please use a different mobile number.`,
        409
      )
    );
  }

  // If password not provided, use mobile number as default password
  const userPassword = password || cleanedMobile;

  // Find default "User" role to assign to new registrations
  const Role = require("../models/roleModel");
  const defaultUserRole = await Role.findOne({ roleKey: "user" });

  // Create new user with status: "pending" by default
  const user = await User.create({
    firstName,
    middleName,
    lastName,
    address,
    age,
    dateOfBirth,
    mobileNumber: formattedMobile,
    email: normalizedEmail,
    occupationType,
    occupationTitle,
    companyOrBusinessName,
    position,
    qualification,
    maritalStatus,
    samaj,
    profileImage,
    subFamilyNumber,
    password: userPassword,
    status: "pending", // Admin must approve
    roleRef: defaultUserRole?._id, // Assign default user role if exists
  });

  // Generate JWT token
  const token = user.getJWTToken();

  // Return user data without password
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(201).json({
    success: true,
    message: "User registered successfully. Waiting for admin approval.",
    user: userData,
    token,
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = catchAsyncErrors(async (req, res, next) => {
  const { emailOrMobile, password } = req.body;

  if (!emailOrMobile || !password) {
    return next(new ErrorHandler("Please provide email/mobile and password", 400));
  }

  // Find user by email or mobile number with role populated (exclude deleted users)
  let user;
  if (emailOrMobile.includes("@")) {
    // It's an email
    user = await User.findOne({
      email: emailOrMobile.toLowerCase(),
      isActive: true,
      deletedAt: null,
    })
      .select("+password")
      .populate("roleRef");
  } else {
    // It's a mobile number - format it
    const cleanedMobile = emailOrMobile.replace(/^\+91/, "").replace(/\s/g, "");
    const formattedMobile = `+91${cleanedMobile}`;
    user = await User.findOne({
      mobileNumber: formattedMobile,
      isActive: true,
      deletedAt: null,
    })
      .select("+password")
      .populate("roleRef");
  }

  if (!user) {
    return next(new ErrorHandler("Invalid email/mobile or password", 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorHandler("Your account has been deactivated", 403));
  }

  // Check if user is approved
  if (user.status !== "approved") {
    return next(
      new ErrorHandler(
        "Your account is pending approval. Please wait for admin approval.",
        403
      )
    );
  }

  // Verify password
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email/mobile or password", 401));
  }

  // Check if user is using default password
  let isDefaultPassword = false;
  if (user.mobileNumber) {
    // Check if password matches mobile number (without +91)
    const cleanedMobile = user.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
    isDefaultPassword = await user.comparePassword(cleanedMobile);
  } else if (user.email) {
    // Check if password matches email prefix (before @)
    const emailPrefix = user.email.split("@")[0];
    isDefaultPassword = await user.comparePassword(emailPrefix);
  }
  
  // Add flag to user object to indicate if password change is needed
  const userData = user.toObject();
  userData.needsPasswordChange = isDefaultPassword;

  // Generate and send token
  sendToken(user, 200, res, userData);
});

/**
 * Forgot password
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return next(new ErrorHandler("User not found with this email", 404));
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // In production, you would send this token via email
  // For now, return it in the response (remove this in production)
  res.status(200).json({
    success: true,
    message: "Password reset token generated",
    resetToken, // Remove this in production and send via email instead
    // resetPasswordUrl: `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`,
  });
});

/**
 * Reset password
 * POST /api/auth/reset-password/:token
 */
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token to compare with stored hash
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid reset token and not expired
  const user = await User.findOne({
    passwordResetToken: resetPasswordToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    return next(
      new ErrorHandler("Reset password token is invalid or has expired", 400)
    );
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Auto-login user after password reset
  sendToken(user, 200, res);
});


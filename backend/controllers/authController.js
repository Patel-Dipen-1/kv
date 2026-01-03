const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorhander");
const User = require("../models/userModel");
const sendToken = require("../utils/jwtToken");
const { normalizePhone, formatPhoneForStorage } = require("../utils/phoneUtils");
const MESSAGES = require("../constants/authMessages");
const crypto = require("crypto");

/**
 * Register a new user
 * POST /api/auth/register
 */
/**
 * Register a new user - PHASE 1: BASIC REGISTRATION ONLY
 * Only collects: firstName, lastName, dateOfBirth, email, mobileNumber, password
 * POST /api/auth/register
 */
exports.register = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    dateOfBirth,
    mobileNumber,
    email,
    password,
    confirmPassword,
  } = req.body;

  // Validate required basic fields
  if (!firstName || !lastName || !dateOfBirth || !email || !mobileNumber || !password) {
    return next(new ErrorHandler("All fields are required: First Name, Last Name, Date of Birth, Email, Mobile Number, and Password", 400));
  }

  // Validate password confirmation
  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match", 400));
  }

  // Validate password strength
  if (password.length < 8) {
    return next(new ErrorHandler("Password must be at least 8 characters", 400));
  }

  // Normalize email to lowercase for comparison
  const normalizedEmail = email.toLowerCase().trim();

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return next(new ErrorHandler("Please enter a valid email address", 400));
  }

  // Check if email already exists (case-insensitive) - only for active/pending/approved users
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
    return next(new ErrorHandler("Invalid mobile number format. Please enter a valid 10-digit Indian mobile number", 400));
  }
  const formattedMobile = `+91${cleanedMobile}`;

  // Check if mobile number already exists - only for active/pending/approved users
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

  // Validate date of birth
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) {
    return next(new ErrorHandler("Please enter a valid date of birth", 400));
  }
  if (dob > new Date()) {
    return next(new ErrorHandler("Date of birth cannot be in the future", 400));
  }

  // Find default "User" role to assign to new registrations
  const Role = require("../models/roleModel");
  const defaultUserRole = await Role.findOne({ roleKey: "user" });

  // Create new user with ONLY basic fields - status: "pending", profileCompleted: false
  const user = await User.create({
    firstName,
    lastName, // Only first and last name at registration
    dateOfBirth: dob,
    mobileNumber: formattedMobile,
    email: normalizedEmail,
    password,
    status: "pending", // Admin must approve
    profileCompleted: false, // Profile not completed yet
    roleRef: defaultUserRole?._id, // Assign default user role if exists
  });

  // Return user data without password
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(201).json({
    success: true,
    message: "Registration submitted. Waiting for approval.",
    user: userData,
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
exports.login = catchAsyncErrors(async (req, res, next) => {
  let { emailOrMobile, password } = req.body;
  emailOrMobile = String(emailOrMobile).trim();

  if (!emailOrMobile || !password) {
    return next(new ErrorHandler(MESSAGES.AUTH.EMAIL_OR_MOBILE_REQUIRED, 400));
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
    // It's a mobile number - normalize and format it
    const normalizedPhone = normalizePhone(emailOrMobile);
    if (!normalizedPhone) {
      return next(new ErrorHandler(MESSAGES.AUTH.INVALID_CREDENTIALS, 401));
    }
    const formattedMobile = formatPhoneForStorage(normalizedPhone);
    if (!formattedMobile) {
      return next(new ErrorHandler(MESSAGES.AUTH.INVALID_CREDENTIALS, 401));
    }
    user = await User.findOne({
      mobileNumber: formattedMobile,
      isActive: true,
      deletedAt: null,
    })
      .select("+password")
      .populate("roleRef");
  }

  if (!user) {
    return next(new ErrorHandler(MESSAGES.AUTH.INVALID_CREDENTIALS, 401));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new ErrorHandler(MESSAGES.AUTH.ACCOUNT_DEACTIVATED, 403));
  }

  // Check if user is approved
  if (user.status !== "approved") {
    if (user.status === "pending") {
      return next(new ErrorHandler("Your account is not approved yet. Please wait for admin approval.", 403));
    }
    return next(new ErrorHandler(MESSAGES.AUTH.ACCOUNT_PENDING_APPROVAL, 403));
  }

  // Verify password
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler(MESSAGES.AUTH.INVALID_CREDENTIALS, 401));
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

/**
 * Complete user profile - PHASE 2: FULL PROFILE COMPLETION
 * POST /api/auth/complete-profile
 * Requires: authenticated user, status = approved, profileCompleted = false
 */
exports.completeProfile = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  
  // Find user
  const user = await User.findById(userId);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Check if user is approved
  if (user.status !== "approved") {
    return next(new ErrorHandler("Your account must be approved before completing profile", 403));
  }

  // Check if profile already completed
  if (user.profileCompleted) {
    return next(new ErrorHandler("Profile already completed", 400));
  }

  const {
    middleName,
    address,
    age,
    gender,
    emergencyContact,
    occupationType,
    occupationTitle,
    companyOrBusinessName,
    position,
    qualification,
    maritalStatus,
    samaj,
    bloodGroup,
    profileImage,
  } = req.body;

  // Validate all required fields
  if (!address || !address.line1 || !address.city || !address.state || !address.country || !address.pincode) {
    return next(new ErrorHandler("All address fields are required", 400));
  }

  if (!gender) {
    return next(new ErrorHandler("Gender is required", 400));
  }

  if (!occupationType) {
    return next(new ErrorHandler("Occupation type is required", 400));
  }

  if (!maritalStatus) {
    return next(new ErrorHandler("Marital status is required", 400));
  }

  if (!samaj) {
    return next(new ErrorHandler("Samaj/Community is required", 400));
  }

  if (!bloodGroup) {
    return next(new ErrorHandler("Blood group is required", 400));
  }

  // Validate location using library service
  const locationService = require("../services/locationService");
  
  if (address && address.city) {
    const cityName = address.city.trim();
    const stateName = address.state?.trim() || null;
    const countryCode = address.country?.toLowerCase() === "india" ? "IN" : "IN";
    
    // Validate city exists in library
    const cityData = locationService.getCityByName(cityName, stateName, countryCode);
    
    if (!cityData) {
      return next(
        new ErrorHandler(
          `City "${cityName}" not found. Please enter a valid city name.`,
          400
        )
      );
    }
    
    // Validate state matches city
    if (stateName && cityData.state.toLowerCase() !== stateName.toLowerCase()) {
      return next(
        new ErrorHandler(
          `State "${stateName}" does not match city "${cityName}". Expected state: "${cityData.state}".`,
          400
        )
      );
    }
    
    // Validate pincode if provided
    if (address.pincode) {
      const pincodeData = await locationService.getPincodeForCity(cityName, cityData.state, countryCode);
      
      if (pincodeData.pincodes.length > 0) {
        if (!pincodeData.pincodes.includes(address.pincode)) {
          return next(
            new ErrorHandler(
              `Pincode "${address.pincode}" is not valid for city "${cityName}". Valid pincodes: ${pincodeData.pincodes.join(", ")}`,
              400
            )
          );
        }
      } else {
        if (!/^\d{6}$/.test(address.pincode)) {
          return next(
            new ErrorHandler(
              `Pincode must be a 6-digit number.`,
              400
            )
          );
        }
      }
    }
  }

  // Calculate age from dateOfBirth if not provided
  let calculatedAge = age;
  if (!calculatedAge && user.dateOfBirth) {
    const dob = new Date(user.dateOfBirth);
    const today = new Date();
    calculatedAge = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
  }

  // Update user with full profile data
  user.middleName = middleName || "";
  user.address = address;
  user.age = calculatedAge;
  user.gender = gender;
  // Emergency contact is optional - only save if provided
  if (emergencyContact && (emergencyContact.name || emergencyContact.phone)) {
    user.emergencyContact = emergencyContact;
  }
  user.occupationType = occupationType;
  user.occupationTitle = occupationTitle || "";
  user.companyOrBusinessName = companyOrBusinessName || "";
  user.position = position || "";
  user.qualification = qualification || "";
  user.maritalStatus = maritalStatus;
  user.samaj = samaj;
  user.bloodGroup = bloodGroup;
  if (profileImage) {
    user.profileImage = profileImage;
  }
  user.profileCompleted = true; // Mark profile as completed

  await user.save();

  // Return updated user data
  const userData = user.toObject();
  delete userData.password;
  delete userData.passwordResetToken;
  delete userData.passwordResetExpires;

  res.status(200).json({
    success: true,
    message: "Profile completed successfully",
    user: userData,
  });
});


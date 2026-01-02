const User = require("../models/userModel");
const FamilyMember = require("../models/familyMemberModel");
const ErrorHandler = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { Parser } = require("json2csv");

/**
 * Export all users to CSV
 * GET /api/admin/export/users
 */
exports.exportAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({})
    .select("-password -passwordResetToken -passwordResetExpires")
    .sort({ createdAt: -1 });

  if (users.length === 0) {
    return next(new ErrorHandler("No users found to export", 404));
  }

  // Transform data for CSV
  const csvData = users.map((user) => ({
    "First Name": user.firstName,
    "Middle Name": user.middleName || "",
    "Last Name": user.lastName,
    "Email": user.email,
    "Mobile Number": user.mobileNumber,
    "Date of Birth": user.dateOfBirth ? user.dateOfBirth.toISOString().split("T")[0] : "",
    "Age": user.age || "",
    "Address Line 1": user.address?.line1 || "",
    "Address Line 2": user.address?.line2 || "",
    "City": user.address?.city || "",
    "State": user.address?.state || "",
    "Country": user.address?.country || "",
    "Pincode": user.address?.pincode || "",
    "Samaj": user.samaj || "",
    "Occupation Type": user.occupationType || "",
    "Occupation Title": user.occupationTitle || "",
    "Company/Business": user.companyOrBusinessName || "",
    "Position": user.position || "",
    "Qualification": user.qualification || "",
    "Marital Status": user.maritalStatus || "",
    "Role": user.role || "",
    "Status": user.status || "",
    "Committee Position": user.committeePosition || "",
    "Sub Family Number": user.subFamilyNumber || "",
    "Family Members Count": user.familyMembersCount || 0,
    "Is Active": user.isActive ? "Yes" : "No",
    "Created At": user.createdAt ? user.createdAt.toISOString() : "",
    "Updated At": user.updatedAt ? user.updatedAt.toISOString() : "",
  }));

  const fields = Object.keys(csvData[0]);
  const parser = new Parser({ fields });
  const csv = parser.parse(csvData);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=all-users-${new Date().toISOString().split("T")[0]}.csv`
  );
  res.status(200).send(csv);
});

/**
 * Export pending users to CSV
 * GET /api/admin/export/pending-users
 */
exports.exportPendingUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ status: "pending" })
    .select("-password -passwordResetToken -passwordResetExpires")
    .sort({ createdAt: -1 });

  if (users.length === 0) {
    return next(new ErrorHandler("No pending users found to export", 404));
  }

  const csvData = users.map((user) => ({
    "First Name": user.firstName,
    "Middle Name": user.middleName || "",
    "Last Name": user.lastName,
    "Email": user.email,
    "Mobile Number": user.mobileNumber,
    "Samaj": user.samaj || "",
    "Sub Family Number": user.subFamilyNumber || "",
    "Created At": user.createdAt ? user.createdAt.toISOString() : "",
  }));

  const fields = Object.keys(csvData[0]);
  const parser = new Parser({ fields });
  const csv = parser.parse(csvData);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=pending-users-${new Date().toISOString().split("T")[0]}.csv`
  );
  res.status(200).send(csv);
});

/**
 * Export family tree for specific subFamilyNumber
 * GET /api/admin/export/family-tree/:subFamilyNumber
 */
exports.exportFamilyTree = catchAsyncErrors(async (req, res, next) => {
  const { subFamilyNumber } = req.params;

  // Get main user
  const user = await User.findOne({ subFamilyNumber })
    .select("-password -passwordResetToken -passwordResetExpires")
    .lean();

  if (!user) {
    return next(
      new ErrorHandler("User with this family number not found", 404)
    );
  }

  // Get all family members
  const familyMembers = await FamilyMember.find({
    subFamilyNumber,
    approvalStatus: "approved",
    isActive: true,
  })
    .sort({ relationshipToUser: 1, createdAt: 1 })
    .lean();

  // Prepare CSV data
  const csvData = [
    // Main user
    {
      "Type": "Main User",
      "First Name": user.firstName,
      "Middle Name": user.middleName || "",
      "Last Name": user.lastName,
      "Email": user.email,
      "Mobile Number": user.mobileNumber,
      "Relationship": "Self",
      "Date of Birth": user.dateOfBirth
        ? user.dateOfBirth.toISOString().split("T")[0]
        : "",
      "Age": user.age || "",
      "Marital Status": user.maritalStatus || "",
      "Occupation": user.occupationType || "",
      "Sub Family Number": user.subFamilyNumber,
    },
    // Family members
    ...familyMembers.map((member) => ({
      "Type": "Family Member",
      "First Name": member.firstName,
      "Middle Name": member.middleName || "",
      "Last Name": member.lastName,
      "Email": member.email || "",
      "Mobile Number": member.mobileNumber || "",
      "Relationship": member.relationshipToUser,
      "Date of Birth": member.dateOfBirth
        ? member.dateOfBirth.toISOString().split("T")[0]
        : "",
      "Age": member.age || "",
      "Marital Status": member.maritalStatus || "",
      "Occupation": member.occupationType || "",
      "Sub Family Number": member.subFamilyNumber,
    })),
  ];

  const fields = Object.keys(csvData[0]);
  const parser = new Parser({ fields });
  const csv = parser.parse(csvData);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=family-tree-${subFamilyNumber}-${new Date().toISOString().split("T")[0]}.csv`
  );
  res.status(200).send(csv);
});

/**
 * Export committee members to CSV
 * GET /api/admin/export/committee-members
 */
exports.exportCommitteeMembers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({
    role: "committee",
    status: "approved",
    isActive: true,
  })
    .select("-password -passwordResetToken -passwordResetExpires")
    .sort({ committeeDisplayOrder: 1, createdAt: 1 });

  if (users.length === 0) {
    return next(new ErrorHandler("No committee members found to export", 404));
  }

  const csvData = users.map((user) => ({
    "First Name": user.firstName,
    "Middle Name": user.middleName || "",
    "Last Name": user.lastName,
    "Email": user.email,
    "Mobile Number": user.mobileNumber,
    "Committee Position": user.committeePosition || "",
    "Display Order": user.committeeDisplayOrder || 0,
    "Bio": user.committeeBio || "",
    "Sub Family Number": user.subFamilyNumber || "",
  }));

  const fields = Object.keys(csvData[0]);
  const parser = new Parser({ fields });
  const csv = parser.parse(csvData);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=committee-members-${new Date().toISOString().split("T")[0]}.csv`
  );
  res.status(200).send(csv);
});


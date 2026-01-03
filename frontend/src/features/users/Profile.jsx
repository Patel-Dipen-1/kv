import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getMyProfile } from "./userSlice";
import {
  getMyFamilyMembers,
  deleteFamilyMember,
  clearError,
} from "../family/familySlice";
import AddFamilyMemberForm from "../family/AddFamilyMemberForm";
import { usePermission } from "../../hooks/usePermission";
import { getStatusColor, getRoleColor, formatDate, formatMobileNumber, getFullName } from "../../utils/helpers";
import { calculateProfileCompletion } from "../../utils/profileCompletion";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import { toast } from "react-toastify";
import { Trash2, Edit2, UserPlus, CheckCircle } from "lucide-react";

const Profile = () => {
  const dispatch = useDispatch();
  const { profile, isLoading, error } = useSelector((state) => state.users);
  const { user: authUser } = useSelector((state) => state.auth);
  const {
    myFamilyMembers,
    isLoading: familyLoading,
    error: familyError,
  } = useSelector((state) => state.family);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Permission checks
  const canEditUsers = usePermission("canEditUsers");
  const canViewUsers = usePermission("canViewUsers");
  const canManageFamilyMembers = usePermission("canManageFamilyMembers");
  // For own profile, always allow view, but edit requires permission
  const canEditOwnProfile = true; // Users can always edit their own profile
  
  // Check if user can add family members
  // Primary account OR family member with canManageFamilyMembers permission
  const isPrimaryAccount = authUser?.isPrimaryAccount !== false; // Default to true if not set
  const canAddFamilyMembers = isPrimaryAccount || canManageFamilyMembers;

  useEffect(() => {
    dispatch(getMyProfile());
    dispatch(getMyFamilyMembers());
  }, [dispatch]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader size="lg" />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4">
          <ErrorAlert message={error} />
        </div>
      </>
    );
  }

  const user = profile || authUser;

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4">
          <Card>
            <p className="text-gray-600">No profile data available.</p>
          </Card>
        </div>
      </>
    );
  }

  // Calculate profile completion
  const profileCompletion = calculateProfileCompletion(user, myFamilyMembers);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <div className="flex flex-wrap gap-2">
              {canEditOwnProfile && (
                <Link to="/profile/edit">
                  <Button variant="primary">Edit Profile</Button>
                </Link>
              )}
              <Link to="/profile/change-password">
                <Button variant="outline">Change Password</Button>
              </Link>
            </div>
          </div>

          {/* Profile Completion Indicator */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Completion
              </h2>
              {profileCompletion.percentage === 100 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <CheckCircle size={20} />
                  Complete
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${
                  profileCompletion.percentage === 100
                    ? "bg-green-500"
                    : profileCompletion.percentage >= 70
                    ? "bg-blue-500"
                    : profileCompletion.percentage >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${profileCompletion.percentage}%` }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <span className={profileCompletion.breakdown.profilePhoto > 0 ? "text-green-600" : "text-gray-400"}>
                    {profileCompletion.breakdown.profilePhoto > 0 ? "✓" : "○"} Profile Photo ({profileCompletion.breakdown.profilePhoto}%)
                  </span>
                </div>
                <div>
                  <span className={profileCompletion.breakdown.address > 0 ? "text-green-600" : "text-gray-400"}>
                    {profileCompletion.breakdown.address > 0 ? "✓" : "○"} Address ({profileCompletion.breakdown.address}%)
                  </span>
                </div>
                <div>
                  <span className={profileCompletion.breakdown.familyMembers > 0 ? "text-green-600" : "text-gray-400"}>
                    {profileCompletion.breakdown.familyMembers > 0 ? "✓" : "○"} Family ({profileCompletion.breakdown.familyMembers}%)
                  </span>
                </div>
                <div>
                  <span className={profileCompletion.breakdown.bio > 0 ? "text-green-600" : "text-gray-400"}>
                    {profileCompletion.breakdown.bio > 0 ? "✓" : "○"} Additional Info ({profileCompletion.breakdown.bio}%)
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Image and Basic Info */}
            <Card className="md:col-span-1">
              <div className="text-center">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl text-gray-400">
                      {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
                <h2 className="text-xl font-semibold text-gray-900">
                  {getFullName(user)}
                </h2>
                <div className="mt-2 space-y-1">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      user.status
                    )}`}
                  >
                    {user.status?.toUpperCase() || "PENDING"}
                  </span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                      user.role
                    )}`}
                  >
                    {user.role?.toUpperCase() || "USER"}
                  </span>
                </div>
              </div>
            </Card>

            {/* Detailed Information */}
            <Card className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.firstName || "N/A"}
                  </p>
                </div>
                {user.middleName && (
                  <div>
                    <p className="text-sm text-gray-500">Middle Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.middleName}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.lastName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile Number</p>
                  <p className="text-base font-medium text-gray-900">
                    {formatMobileNumber(user.mobileNumber)}
                  </p>
                </div>
                {user.dateOfBirth && (
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="text-base font-medium text-gray-900">
                      {formatDate(user.dateOfBirth)}
                    </p>
                  </div>
                )}
                {user.age && (
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.age} years
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Marital Status</p>
                  <p className="text-base font-medium text-gray-900 capitalize">
                    {user.maritalStatus || "N/A"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Address */}
            {user.address && (
              <Card className="md:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Address Line 1</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.address.line1 || "N/A"}
                    </p>
                  </div>
                  {user.address.line2 && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Address Line 2</p>
                      <p className="text-base font-medium text-gray-900">
                        {user.address.line2}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.address.city || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.address.state || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pincode</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.address.pincode || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.address.country || "India"}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Occupation */}
            <Card className="md:col-span-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Occupation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Occupation Type</p>
                  <p className="text-base font-medium text-gray-900 capitalize">
                    {user.occupationType || "N/A"}
                  </p>
                </div>
                {user.occupationTitle && (
                  <div>
                    <p className="text-sm text-gray-500">Occupation Title</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.occupationTitle}
                    </p>
                  </div>
                )}
                {user.companyOrBusinessName && (
                  <div>
                    <p className="text-sm text-gray-500">Company/Business</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.companyOrBusinessName}
                    </p>
                  </div>
                )}
                {user.position && (
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.position}
                    </p>
                  </div>
                )}
                {user.qualification && (
                  <div>
                    <p className="text-sm text-gray-500">Qualification</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.qualification}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Family Information */}
            {user.subFamilyNumber && (
              <Card className="md:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Family Information
                </h3>
                <div>
                  <p className="text-sm text-gray-500">Sub-Family Number</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.subFamilyNumber}
                  </p>
                </div>
              </Card>
            )}

            {/* Family Members Section */}
            <div className="md:col-span-3 mt-6">
              <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      My Family Members
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {myFamilyMembers.length}/5 members (first 5 auto-approved)
                    </p>
                  </div>
                  {canAddFamilyMembers && (
                    <Button
                      variant="primary"
                      onClick={() => setShowAddForm(true)}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      <UserPlus size={18} />
                      Add Family Member
                    </Button>
                  )}
                </div>

                {/* Primary Account Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <div className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={getFullName(user)}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
                          <span className="text-lg text-blue-600">
                            {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {getFullName(user)}
                          </h3>
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                            Primary Account
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {user.role || "User"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to="/profile/edit">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                          aria-label="Edit profile"
                          title="Edit Profile"
                        >
                          <Edit2 size={18} />
                        </button>
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {user.age && <p>Age: {user.age} years</p>}
                    {user.mobileNumber && (
                      <p>Phone: {formatMobileNumber(user.mobileNumber)}</p>
                    )}
                    {user.email && <p>Email: {user.email}</p>}
                    {user.occupationType && (
                      <p className="capitalize">
                        Occupation: {user.occupationType}
                      </p>
                    )}
                  </div>
                  </div>

                {/* Family Members */}
                {myFamilyMembers.length === 0 ? (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <p className="text-center text-gray-600 py-8">
                      No family members added yet. Click "Add Family Member" to get
                      started.
                    </p>
                  </div>
                ) : (
                  myFamilyMembers.map((member) => (
                    <Card key={member._id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {member.profileImage ? (
                            <img
                              src={member.profileImage}
                              alt={getFullName(member)}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-lg text-gray-400">
                                {member.firstName?.charAt(0)?.toUpperCase() || "F"}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {getFullName(member)}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {member.relationshipToUser}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setShowAddForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Edit family member"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={async () => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this family member?"
                                )
                              ) {
                                const result = await dispatch(
                                  deleteFamilyMember(member._id)
                                );
                                if (deleteFamilyMember.fulfilled.match(result)) {
                                  toast.success("Family member deleted successfully");
                                  dispatch(getMyFamilyMembers());
                                }
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Delete family member"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        {member.age && <p>Age: {member.age} years</p>}
                        {member.mobileNumber && (
                          <p>Phone: {formatMobileNumber(member.mobileNumber)}</p>
                        )}
                        {member.email && <p>Email: {member.email}</p>}
                        {member.occupationType && (
                          <p className="capitalize">
                            Occupation: {member.occupationType}
                          </p>
                        )}
                      </div>
                    </Card>
                  ))
                )}
                </div>

                {myFamilyMembers.length >= 5 && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> You have {myFamilyMembers.length}{" "}
                      family members. Additional members (6+) will require admin
                      approval.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <AddFamilyMemberForm
          onClose={() => {
            setShowAddForm(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            dispatch(getMyFamilyMembers());
            dispatch(getMyProfile());
            setEditingMember(null);
          }}
          editData={editingMember}
        />
      )}
    </>
  );
};

export default Profile;


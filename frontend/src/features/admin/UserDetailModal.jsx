import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { X } from "lucide-react";
import { useEnums } from "../../hooks/useEnums";
import { usePermission } from "../../hooks/usePermission";
import { formatDate, formatMobileNumber, getFullName, getStatusColor, getRoleColor } from "../../utils/helpers";
import Button from "../../components/common/Button";
import UserRoleModal from "./UserRoleModal";
import { transferPrimaryAccount } from "./adminSlice";
import axiosInstance from "../../api/axiosConfig";
import { toast } from "react-toastify";

const UserDetailModal = ({ user, onClose, onApprove, onReject, isLoading, onRoleUpdate }) => {
  const dispatch = useDispatch();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [familyMembersForTransfer, setFamilyMembersForTransfer] = useState(null);
  const [selectedNewPrimary, setSelectedNewPrimary] = useState("");
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState([]);
  const [transferReason, setTransferReason] = useState("");
  const [isLoadingFamily, setIsLoadingFamily] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const { user: currentUser } = useSelector((state) => state.auth);
  
  // Get dynamic enums
  const USER_ROLES = useEnums("USER_ROLES");
  const USER_STATUS = useEnums("USER_STATUS");
  const COMMITTEE_POSITIONS = useEnums("COMMITTEE_POSITIONS");
  
  // Permission checks
  const canApproveUsers = usePermission("canApproveUsers");
  const canChangeRoles = usePermission("canChangeRoles");
  const canEditUsers = usePermission("canEditUsers");
  const canManageUsers = usePermission("canManageUsers");

  if (!user) return null;

  const handleRoleUpdateSuccess = () => {
    if (onRoleUpdate) onRoleUpdate();
    setShowRoleModal(false);
  };

  const handleOpenTransferModal = async () => {
    setShowTransferModal(true);
    setIsLoadingFamily(true);
    try {
      const response = await axiosInstance.get(`/users/${user._id}/family-for-transfer`);
      setFamilyMembersForTransfer(response.data.data);
      // Auto-select all family members by default
      if (response.data.data.familyMemberRecords) {
        setSelectedFamilyMembers(
          response.data.data.familyMemberRecords.map((fm) => fm._id)
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load family members");
      setShowTransferModal(false);
    } finally {
      setIsLoadingFamily(false);
    }
  };

  const handleTransferPrimary = async () => {
    if (!selectedNewPrimary) {
      toast.error("Please select a new primary account holder");
      return;
    }

    if (!window.confirm(
      `Are you sure you want to transfer primary account from ${getFullName(user)} to the selected user?\n\n` +
      `This will migrate ${selectedFamilyMembers.length} family member(s) to the new primary account.`
    )) {
      return;
    }

    setIsTransferring(true);
    try {
      const result = await dispatch(transferPrimaryAccount({
        userId: user._id,
        newPrimaryUserId: selectedNewPrimary,
        reason: transferReason || "Primary account transfer",
        familyMemberIds: selectedFamilyMembers,
      }));

      if (transferPrimaryAccount.fulfilled.match(result)) {
        toast.success(
          `Primary account transferred successfully! ${result.payload.data.familyMembersMigrated || 0} family member(s) migrated.`
        );
        setShowTransferModal(false);
        setSelectedNewPrimary("");
        setSelectedFamilyMembers([]);
        setTransferReason("");
        if (onRoleUpdate) onRoleUpdate();
        onClose();
      } else {
        toast.error(result.payload || "Failed to transfer primary account");
      }
    } catch (error) {
      toast.error("Failed to transfer primary account");
    } finally {
      setIsTransferring(false);
    }
  };

  const handleToggleFamilyMember = (memberId) => {
    if (selectedFamilyMembers.includes(memberId)) {
      setSelectedFamilyMembers(selectedFamilyMembers.filter((id) => id !== memberId));
    } else {
      setSelectedFamilyMembers([...selectedFamilyMembers, memberId]);
    }
  };

  const handleSelectAllFamilyMembers = (checked) => {
    if (checked && familyMembersForTransfer?.familyMemberRecords) {
      setSelectedFamilyMembers(
        familyMembersForTransfer.familyMemberRecords.map((fm) => fm._id)
      );
    } else {
      setSelectedFamilyMembers([]);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          // Close modal when clicking outside
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            User Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
            disabled={isLoading}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Image and Basic Info */}
          <div className="flex items-center space-x-4 border-b pb-4">
            {user.profileImage ? (
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl text-gray-400">
                  {user.firstName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getFullName(user)}
              </h3>
              <div className="mt-1 space-x-2">
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    user.status
                  )}`}
                >
                  {user.status?.toUpperCase()}
                </span>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                    user.role
                  )}`}
                >
                  {user.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Personal Information
            </h4>
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
          </div>

          {/* Address */}
          {user.address && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                Address
              </h4>
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
            </div>
          )}

          {/* Occupation */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">
              Occupation
            </h4>
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
          </div>

          {/* Committee Information */}
          {user.role === "committee" && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                Committee Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.committeePosition && (
                  <div>
                    <p className="text-sm text-gray-500">Position</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.committeePosition}
                    </p>
                  </div>
                )}
                {user.committeeDisplayOrder !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Display Order</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.committeeDisplayOrder}
                    </p>
                  </div>
                )}
                {user.committeeBio && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Bio</p>
                    <p className="text-base font-medium text-gray-900">
                      {user.committeeBio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Family Information */}
          {user.subFamilyNumber && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">
                Family Information
              </h4>
              <div>
                <p className="text-sm text-gray-500">Sub-Family Number</p>
                <p className="text-base font-medium text-gray-900">
                  {user.subFamilyNumber}
                </p>
                {user.isPrimaryAccount && (
                  <p className="text-sm text-blue-600 mt-1">
                    ✓ Primary Account Holder
                  </p>
                )}
                {user.transferredFrom && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Transferred From:</strong> {user.transferredFrom?.firstName} {user.transferredFrom?.lastName || "Previous Primary"}
                    </p>
                    {user.transferredAt && (
                      <p className="text-xs text-gray-500">
                        Transferred on: {formatDate(user.transferredAt)}
                      </p>
                    )}
                    {user.transferReason && (
                      <p className="text-xs text-gray-500 mt-1">
                        Reason: {user.transferReason}
                      </p>
                    )}
                  </div>
                )}
                {/* Transfer History Chain */}
                {user.transferHistory && user.transferHistory.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      Transfer History Chain:
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {user.transferHistory.map((transfer, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded border border-blue-200">
                          <p className="text-xs text-gray-700">
                            <strong>Step {index + 1}:</strong> {transfer.fromUserName} → {transfer.toUserName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(transfer.transferredAt)} • {transfer.familyMembersMigrated || 0} member(s) migrated
                          </p>
                          {transfer.reason && (
                            <p className="text-xs text-gray-500 mt-1">
                              Reason: {transfer.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons - Status Change Controls */}
          <div className="flex flex-wrap gap-4 pt-4 border-t">
            {/* Status Change Buttons - Show for all statuses if admin has permission */}
            {canApproveUsers && (
              <>
                {/* Show Approve button if user is pending or rejected */}
                {(user.status === "pending" || user.status === "rejected") && (
                  <Button
                    variant="primary"
                    onClick={() => onApprove && onApprove(user._id)}
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="flex-1 min-w-[120px]"
                  >
                    {user.status === "rejected" ? "Approve User" : "Approve"}
                  </Button>
                )}
                
                {/* Show Reject button if user is pending or approved */}
                {(user.status === "pending" || user.status === "approved") && (
                  <Button
                    variant="danger"
                    onClick={() => onReject && onReject(user._id)}
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="flex-1 min-w-[120px]"
                  >
                    {user.status === "approved" ? "Reject User" : "Reject"}
                  </Button>
                )}
              </>
            )}
            
            {/* Role Change Button */}
            {canChangeRoles && (
              <Button
                variant="outline"
                onClick={() => setShowRoleModal(true)}
                className="flex-1 min-w-[120px]"
              >
                Change Role
              </Button>
            )}

            {/* Transfer Primary Account Button - Only show for primary accounts */}
            {canManageUsers && user.isPrimaryAccount && (
              <Button
                variant="warning"
                onClick={handleOpenTransferModal}
                className="flex-1 min-w-[120px]"
              >
                Transfer Primary Account
              </Button>
            )}
            
            {/* Close Button */}
            <Button variant="secondary" onClick={onClose} className="flex-1 min-w-[120px]">
              Close
            </Button>
          </div>
        </div>
        </div>
      </div>

      {showRoleModal && (
        <UserRoleModal
          user={user}
          onClose={() => setShowRoleModal(false)}
          onSuccess={handleRoleUpdateSuccess}
        />
      )}

      {/* Transfer Primary Account Modal */}
      {showTransferModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isTransferring) {
              setShowTransferModal(false);
            }
          }}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Transfer Primary Account
              </h2>
              <button
                onClick={() => !isTransferring && setShowTransferModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isTransferring}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 font-semibold mb-2">
                  Transferring from: {getFullName(user)}
                </p>
                <p className="text-blue-700 text-sm">
                  Select a new primary account holder and choose which family members to migrate.
                </p>
              </div>

              {isLoadingFamily ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading family members...</p>
                </div>
              ) : familyMembersForTransfer ? (
                <>
                  {/* Select New Primary */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select New Primary Account Holder <span className="text-red-500">*</span>
                    </label>
                    {familyMembersForTransfer.eligibleForPrimary.length === 0 ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800">
                          ⚠️ No family members with login accounts found. You must create a login account for a family member first.
                        </p>
                      </div>
                    ) : (
                      <select
                        value={selectedNewPrimary}
                        onChange={(e) => setSelectedNewPrimary(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isTransferring}
                      >
                        <option value="">Select a family member...</option>
                        {familyMembersForTransfer.eligibleForPrimary.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.name} {user.email ? `(${user.email})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Family Members to Transfer */}
                  {familyMembersForTransfer.familyMemberRecords.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Family Members to Transfer ({familyMembersForTransfer.familyMemberRecords.length})
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={
                              selectedFamilyMembers.length ===
                              familyMembersForTransfer.familyMemberRecords.length
                            }
                            onChange={(e) => handleSelectAllFamilyMembers(e.target.checked)}
                            className="mr-2"
                            disabled={isTransferring}
                          />
                          <span className="text-sm text-gray-600">Select All</span>
                        </label>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                        {familyMembersForTransfer.familyMemberRecords.map((fm) => (
                          <label
                            key={fm._id}
                            className="flex items-center p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedFamilyMembers.includes(fm._id)}
                              onChange={() => handleToggleFamilyMember(fm._id)}
                              className="mr-3"
                              disabled={isTransferring}
                            />
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{fm.name}</span>
                              <span className="text-sm text-gray-600 ml-2">
                                ({fm.relationshipToUser})
                              </span>
                              {fm.hasLoginAccount && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                  Has Login
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Selected members will be transferred to the new primary account.
                      </p>
                    </div>
                  )}

                  {/* Transfer Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer Reason (Optional)
                    </label>
                    <textarea
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="3"
                      placeholder="e.g., Account holder deceased, Transfer of ownership..."
                      disabled={isTransferring}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setShowTransferModal(false)}
                      disabled={isTransferring}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="warning"
                      onClick={handleTransferPrimary}
                      isLoading={isTransferring}
                      disabled={!selectedNewPrimary || isTransferring || familyMembersForTransfer.eligibleForPrimary.length === 0}
                    >
                      {isTransferring ? "Transferring..." : "Transfer & Migrate"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-600">
                  Failed to load family members
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserDetailModal;


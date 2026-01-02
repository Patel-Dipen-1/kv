import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X } from "lucide-react";
import { updateUserRole, clearError } from "./adminSlice";
import { useEnums } from "../../hooks/useEnums";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import ErrorAlert from "../../components/common/ErrorAlert";
import { toast } from "react-toastify";

const UserRoleModal = ({ user, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { isLoading, error } = useSelector((state) => state.admin);
  
  // Get dynamic enums
  const USER_ROLES = useEnums("USER_ROLES");
  const COMMITTEE_POSITIONS = useEnums("COMMITTEE_POSITIONS");

  const [role, setRole] = useState(user?.role || USER_ROLES[0] || "user"); // Default to "user"
  const [committeePosition, setCommitteePosition] = useState(
    user?.committeePosition || ""
  );
  const [committeeDisplayOrder, setCommitteeDisplayOrder] = useState(
    user?.committeeDisplayOrder || 0
  );
  const [committeeBio, setCommitteeBio] = useState(user?.committeeBio || "");

  useEffect(() => {
    if (user) {
      setRole(user.role || USER_ROLES[0] || "user");
      setCommitteePosition(user.committeePosition || "");
      setCommitteeDisplayOrder(user.committeeDisplayOrder || 0);
      setCommitteeBio(user.committeeBio || "");
    }
  }, [user, USER_ROLES]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: if role is committee, position is required
    const committeeRoleValue = USER_ROLES.find(r => r === "committee") || USER_ROLES[1];
    if (role === "committee" && !committeePosition) {
      toast.error("Committee position is required when assigning committee role");
      return;
    }

    try {
      const isCommitteeRole = role === "committee";
      
      const result = await dispatch(
        updateUserRole({
          userId: user._id,
          role,
          committeePosition: isCommitteeRole ? committeePosition : undefined,
          committeeDisplayOrder: isCommitteeRole ? committeeDisplayOrder : undefined,
          committeeBio: isCommitteeRole ? committeeBio : undefined,
        })
      );

      if (updateUserRole.fulfilled.match(result)) {
        const message = isCommitteeRole
          ? `User role updated to ${committeePosition} successfully`
          : `User role updated to ${role} successfully`;
        toast.success(message);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  // Use COMMITTEE_POSITIONS from enums

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Update User Role</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              required
            >
              {USER_ROLES.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Committee fields - shown only when role is "committee" */}
          {role === "committee" && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Committee Position <span className="text-red-500">*</span>
                </label>
                <select
                  value={committeePosition}
                  onChange={(e) => setCommitteePosition(e.target.value)}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  required
                >
                  <option value="">Select position</option>
                  {COMMITTEE_POSITIONS.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Position will be displayed on the committee page
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={committeeDisplayOrder}
                  onChange={(e) =>
                    setCommitteeDisplayOrder(parseInt(e.target.value) || 0)
                  }
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lower number = displayed first (e.g., President = 1, VP = 2)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio (Optional)
                </label>
                <textarea
                  value={committeeBio}
                  onChange={(e) => setCommitteeBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Short description for committee page (max 500 characters)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {committeeBio.length}/500 characters
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
              disabled={isLoading}
            >
              Update Role
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRoleModal;


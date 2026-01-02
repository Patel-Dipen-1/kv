import React, { useState, useEffect, useMemo } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "react-toastify";
import Button from "../../components/common/Button";
import { PERMISSIONS, getAllPermissions } from "../../constants/permissions";

const RoleFormModal = ({ role, permissions, onClose, onSubmit, isLoading }) => {
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    // Reset expanded categories when role changes
    setExpandedCategories({});
    
    if (role) {
      setRoleName(role.roleName || "");
      setDescription(role.description || "");
      
      // Convert permissions Map to object if needed
      let perms = {};
      if (role.permissions) {
        if (role.permissions instanceof Map) {
          role.permissions.forEach((value, key) => {
            perms[key] = value === true;
          });
        } else if (typeof role.permissions === "object") {
          perms = { ...role.permissions };
        }
      }
      setSelectedPermissions(perms);
    } else {
      // New role - all permissions false
      setRoleName("");
      setDescription("");
      const allPerms = getAllPermissions();
      const defaultPerms = {};
      allPerms.forEach((perm) => {
        defaultPerms[perm.key] = false;
      });
      setSelectedPermissions(defaultPerms);
    }
  }, [role]);

  const toggleCategory = (categoryKey) => {
    setExpandedCategories((prev) => {
      const newState = { ...prev };
      // Default to true if not set, so toggle to false
      if (prev[categoryKey] === undefined || prev[categoryKey] === true) {
        newState[categoryKey] = false;
      } else {
        newState[categoryKey] = true;
      }
      return newState;
    });
  };

  const togglePermission = (permissionKey) => {
    setSelectedPermissions((prev) => ({
      ...prev,
      [permissionKey]: !prev[permissionKey],
    }));
  };

  const selectAllInCategory = (category) => {
    const categoryPerms = {};
    Object.values(category).forEach((perm) => {
      categoryPerms[perm.key] = true;
    });
    setSelectedPermissions((prev) => ({ ...prev, ...categoryPerms }));
  };

  const deselectAllInCategory = (category) => {
    const categoryPerms = {};
    Object.values(category).forEach((perm) => {
      categoryPerms[perm.key] = false;
    });
    setSelectedPermissions((prev) => ({ ...prev, ...categoryPerms }));
  };

  const selectAllPermissions = () => {
    const allPerms = getAllPermissions();
    const allSelected = {};
    allPerms.forEach((perm) => {
      allSelected[perm.key] = true;
    });
    setSelectedPermissions(allSelected);
  };

  const clearAllPermissions = () => {
    const allPerms = getAllPermissions();
    const allCleared = {};
    allPerms.forEach((perm) => {
      allCleared[perm.key] = false;
    });
    setSelectedPermissions(allCleared);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!roleName.trim()) {
      toast.error("Role name is required");
      return;
    }

    const enabledCount = Object.values(selectedPermissions).filter((v) => v === true).length;
    if (enabledCount === 0) {
      toast.error("At least one permission must be enabled");
      return;
    }

    onSubmit({
      roleName: roleName.trim(),
      description: description.trim(),
      permissions: selectedPermissions,
    });
  };

  const enabledCount = Object.values(selectedPermissions).filter((v) => v === true).length;
  const totalCount = Object.keys(selectedPermissions).length;
  
  // Memoize permissions data to prevent unnecessary re-renders
  const permissionsData = useMemo(() => {
    return permissions || PERMISSIONS;
  }, [permissions]);

  // Memoize category entries to prevent re-creation on every render
  const categoryEntries = useMemo(() => {
    return Object.entries(permissionsData);
  }, [permissionsData]);

  // Don't render if no permissions data
  if (!permissionsData || Object.keys(permissionsData).length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {role ? "Edit Role" : "Create New Role"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="e.g., Event Manager, Treasurer"
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  required
                  disabled={role?.isSystemRole}
                />
                {role?.isSystemRole && (
                  <p className="mt-1 text-xs text-gray-500">
                    System role name cannot be changed
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this role responsible for?"
                  rows={3}
                  maxLength={500}
                  className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {description.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Permissions
              </h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={selectAllPermissions}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearAllPermissions}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">
                {enabledCount} of {totalCount} permissions selected
              </p>
            </div>

            {role?.isSystemRole && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is a system role. Some permissions may be restricted.
                </p>
              </div>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {categoryEntries.map(([categoryKey, category]) => {
                const isExpanded = expandedCategories[categoryKey] !== false;
                const categoryPerms = Object.values(category);
                const enabledInCategory = categoryPerms.filter(
                  (perm) => selectedPermissions[perm.key] === true
                ).length;

                return (
                  <div key={`category-${categoryKey}`} className="border border-gray-200 rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleCategory(categoryKey)}
                      className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-t-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {categoryKey.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({enabledInCategory} / {categoryPerms.length})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            selectAllInCategory(category);
                          }}
                        >
                          All
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deselectAllInCategory(category);
                          }}
                        >
                          None
                        </Button>
                        {isExpanded ? (
                          <ChevronUp size={18} className="text-gray-500" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded ? (
                      <div key={`content-${categoryKey}`} className="p-4 space-y-2">
                        {categoryPerms.map((permission) => (
                          <label
                            key={`perm-${categoryKey}-${permission.key}`}
                            className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions[permission.key] === true}
                              onChange={() => togglePermission(permission.key)}
                              disabled={
                                role?.isSystemRole &&
                                role.roleKey === "admin" &&
                                ["canManageRoles", "canManageSettings"].includes(
                                  permission.key
                                )
                              }
                              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 min-w-[20px] min-h-[20px]"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {permission.label}
                              </div>
                              <div className="text-xs text-gray-500">
                                {permission.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
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
            >
              {role ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleFormModal;


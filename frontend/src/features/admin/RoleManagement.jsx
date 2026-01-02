import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getAllPermissions,
  initializeSystemRoles,
  clearError,
  clearCurrentRole,
} from "../roles/roleSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { Plus, Edit2, Trash2, Shield, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";
import RoleFormModal from "./RoleFormModal";

const RoleManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { roles, currentRole, permissions, isLoading, error } = useSelector(
    (state) => state.roles
  );
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    dispatch(getAllRoles());
    dispatch(getAllPermissions());
  }, [dispatch]);

  const handleCreateRole = () => {
    // Close any open modal first
    setShowFormModal(false);
    setEditingRole(null);
    
    // Small delay to ensure modal is closed before opening new one
    setTimeout(() => {
      setEditingRole(null);
      setShowFormModal(true);
    }, 100);
  };

  const handleEditRole = async (roleId) => {
    // Close any open modal first
    setShowFormModal(false);
    setEditingRole(null);
    
    // Small delay to ensure modal is closed before opening new one
    setTimeout(async () => {
      const result = await dispatch(getRoleById(roleId));
      if (getRoleById.fulfilled.match(result)) {
        setEditingRole(result.payload.role);
        setShowFormModal(true);
      }
    }, 100);
  };

  const handleDeleteRole = async (roleId, roleName, userCount) => {
    if (userCount > 0) {
      toast.error(
        `Cannot delete role. ${userCount} user(s) still have this role. Please reassign them first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${roleName}"? This action cannot be undone.`)) {
      return;
    }

    const result = await dispatch(deleteRole(roleId));
    if (deleteRole.fulfilled.match(result)) {
      toast.success("Role deleted successfully");
      dispatch(getAllRoles());
    } else {
      toast.error(result.payload || "Failed to delete role");
    }
  };

  const handleInitializeRoles = async () => {
    if (!window.confirm("This will initialize system roles. Continue?")) {
      return;
    }

    const result = await dispatch(initializeSystemRoles());
    if (initializeSystemRoles.fulfilled.match(result)) {
      toast.success("System roles initialized successfully");
      dispatch(getAllRoles());
    } else {
      toast.error(result.payload || "Failed to initialize roles");
    }
  };

  const handleFormSubmit = async (formData) => {
    // Close modal first to prevent DOM issues during state updates
    const roleId = editingRole?._id;
    setShowFormModal(false);
    setEditingRole(null);
    
    // Use setTimeout to ensure modal is closed before state updates
    setTimeout(async () => {
      if (roleId) {
        const result = await dispatch(
          updateRole({ roleId, roleData: formData })
        );
        if (updateRole.fulfilled.match(result)) {
          toast.success("Role updated successfully");
          dispatch(getAllRoles());
        } else {
          toast.error(result.payload || "Failed to update role");
        }
      } else {
        const result = await dispatch(createRole(formData));
        if (createRole.fulfilled.match(result)) {
          toast.success("Role created successfully");
          dispatch(getAllRoles());
        } else {
          toast.error(result.payload || "Failed to create role");
        }
      }
    }, 150);
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleInitializeRoles}
                isLoading={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Initialize System Roles
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateRole}
                className="flex items-center gap-2"
              >
                <Plus size={18} />
                Create New Role
              </Button>
            </div>
          </div>

          {error && (
            <ErrorAlert
              message={error}
              onDismiss={() => dispatch(clearError())}
              className="mb-4"
            />
          )}

          {isLoading && roles.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : roles.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Shield size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">No roles found.</p>
                <Button variant="primary" onClick={handleInitializeRoles}>
                  Initialize System Roles
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles.map((role) => (
                <Card key={role._id} className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {role.roleName}
                        </h3>
                        {role.isSystemRole && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            System
                          </span>
                        )}
                        {!role.isSystemRole && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            Custom
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {role.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Permissions:</span>
                      <span className="font-medium text-gray-900">
                        {role.enabledPermissionsCount} / {role.totalPermissionsCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Users:</span>
                      <span className="font-medium text-gray-900">
                        {role.userCount || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleEditRole(role._id)}
                      fullWidth
                      className="flex items-center justify-center gap-2"
                    >
                      <Edit2 size={16} />
                      Edit
                    </Button>
                    {!role.isSystemRole && (
                      <Button
                        variant="danger"
                        onClick={() =>
                          handleDeleteRole(role._id, role.roleName, role.userCount)
                        }
                        fullWidth
                        className="flex items-center justify-center gap-2"
                        disabled={role.userCount > 0}
                        title={
                          role.userCount > 0
                            ? "Cannot delete role with assigned users"
                            : "Delete role"
                        }
                      >
                        <Trash2 size={16} />
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {showFormModal && (
            <RoleFormModal
              key={editingRole?._id || "new-role"}
              role={editingRole}
              permissions={permissions}
              onClose={() => {
                setShowFormModal(false);
                setEditingRole(null);
                dispatch(clearCurrentRole());
              }}
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default RoleManagement;


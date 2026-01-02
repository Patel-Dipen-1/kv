import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllEnums,
  getEnumByType,
  createOrUpdateEnum,
  addEnumValue,
  removeEnumValue,
  initializeEnums,
} from "./adminSlice";
import { fetchEnums as fetchDynamicEnums } from "../enums/enumSlice";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import Loader from "../../components/common/Loader";
import ErrorAlert from "../../components/common/ErrorAlert";
import Navbar from "../../components/layout/Navbar";
import Sidebar from "../../components/layout/Sidebar";
import { Plus, Trash2, Save, RefreshCw, X } from "lucide-react";
import { toast } from "react-toastify";

const EnumManagement = () => {
  const dispatch = useDispatch();
  const { enums, isLoading, error } = useSelector((state) => state.admin);
  const [selectedEnumType, setSelectedEnumType] = useState("");
  const [editingEnum, setEditingEnum] = useState(null);
  const [newValue, setNewValue] = useState("");
  const [showAddValue, setShowAddValue] = useState(false);

  useEffect(() => {
    dispatch(getAllEnums());
  }, [dispatch]);

  const enumTypes = [
    { key: "USER_ROLES", label: "User Roles", description: "User role types (user, committee, moderator, admin)" },
    { key: "USER_STATUS", label: "User Status", description: "User approval status (pending, approved, rejected)" },
    { key: "COMMITTEE_POSITIONS", label: "Committee Positions", description: "Committee member positions" },
    { key: "MARITAL_STATUS", label: "Marital Status", description: "Marital status options" },
    { key: "OCCUPATION_TYPES", label: "Occupation Types", description: "Occupation categories" },
    { key: "RELATIONSHIP_TYPES", label: "Relationship Types", description: "Family relationship types" },
    { key: "SAMAJ_TYPES", label: "Samaj/Community Types", description: "Community/Samaj categories" },
    { key: "COUNTRIES", label: "Countries", description: "Country list" },
  ];

  const handleInitialize = async () => {
    if (window.confirm("This will sync enums from code constants. Continue?")) {
      const result = await dispatch(initializeEnums());
      if (initializeEnums.fulfilled.match(result)) {
        toast.success("Enums initialized successfully!");
        await dispatch(getAllEnums());
        // Refresh dynamic enums for frontend components
        dispatch(fetchDynamicEnums());
      } else {
        toast.error(result.payload || "Failed to initialize enums");
      }
    }
  };

  const handleEdit = (enumType) => {
    const enumData = enums?.find((e) => e.enumType === enumType);
    if (enumData) {
      setEditingEnum({ ...enumData });
      setSelectedEnumType(enumType);
    }
  };

  const handleSave = async () => {
    if (!editingEnum || editingEnum.values.length === 0) {
      toast.error("Enum must have at least one value");
      return;
    }

    const result = await dispatch(
      createOrUpdateEnum({
        enumType: editingEnum.enumType,
        values: editingEnum.values,
        description: editingEnum.description,
      })
    );

    if (createOrUpdateEnum.fulfilled.match(result)) {
      toast.success(`Enum ${editingEnum.enumType} updated successfully!`);
      // Clear editing state first to prevent DOM manipulation errors
      const savedEnumType = editingEnum.enumType;
      setEditingEnum(null);
      setSelectedEnumType("");
      setNewValue("");
      setShowAddValue(false);
      // Then refresh the enums list
      await dispatch(getAllEnums());
      // Also refresh dynamic enums for frontend components
      dispatch(fetchDynamicEnums());
    } else {
      toast.error(result.payload || "Failed to update enum");
    }
  };

  const handleAddValue = async () => {
    if (!newValue.trim()) {
      toast.error("Please enter a value");
      return;
    }

    if (editingEnum.values.includes(newValue.trim())) {
      toast.error("Value already exists");
      return;
    }

    // Add value locally first for immediate UI update
    const updatedValues = [...editingEnum.values, newValue.trim()];
    setEditingEnum({ ...editingEnum, values: updatedValues });
    setNewValue("");
    setShowAddValue(false);

    // Then save to backend
    const result = await dispatch(
      addEnumValue({
        enumType: editingEnum.enumType,
        value: newValue.trim(),
      })
    );

    if (addEnumValue.fulfilled.match(result)) {
      toast.success(`Value "${newValue.trim()}" added successfully!`);
      // Refresh the enums list to update the count on the left
      await dispatch(getAllEnums());
      // Refresh dynamic enums for frontend components
      dispatch(fetchDynamicEnums());
      // Update editing enum with latest from backend
      const updated = await dispatch(getEnumByType(editingEnum.enumType));
      if (getEnumByType.fulfilled.match(updated)) {
        setEditingEnum(updated.payload);
      } else {
        // If getEnumByType fails, use the result from addEnumValue
        setEditingEnum({ ...editingEnum, values: result.payload.values });
      }
    } else {
      toast.error(result.payload || "Failed to add value");
      // Revert local change on error - restore previous values
      const revertedValues = editingEnum.values.filter(v => v !== newValue.trim());
      setEditingEnum({ ...editingEnum, values: revertedValues });
    }
  };

  const handleRemoveValue = async (value) => {
    if (!window.confirm(`Remove "${value}" from ${editingEnum.enumType}?`)) {
      return;
    }

    if (editingEnum.values.length === 1) {
      toast.error("Cannot remove the last value. Enum must have at least one value.");
      return;
    }

    // Save to backend first
    const result = await dispatch(
      removeEnumValue({
        enumType: editingEnum.enumType,
        value,
      })
    );

    if (removeEnumValue.fulfilled.match(result)) {
      toast.success(`Value "${value}" removed successfully!`);
      // Refresh the enums list to update the count on the left
      await dispatch(getAllEnums());
      // Refresh dynamic enums for frontend components
      dispatch(fetchDynamicEnums());
      // Update editing enum with latest from backend
      const updated = await dispatch(getEnumByType(editingEnum.enumType));
      if (getEnumByType.fulfilled.match(updated)) {
        setEditingEnum(updated.payload);
      } else if (result.payload) {
        // If getEnumByType fails, use the result from removeEnumValue
        setEditingEnum({ ...editingEnum, values: result.payload.values });
      }
    } else {
      toast.error(result.payload || "Failed to remove value");
    }
  };

  const handleCancel = () => {
    setEditingEnum(null);
    setSelectedEnumType("");
    setNewValue("");
    setShowAddValue(false);
  };

  const getEnumData = (enumType) => {
    return enums?.find((e) => e.enumType === enumType);
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="min-h-screen bg-gray-50 md:ml-64">
        <div className="p-4 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Enum Management</h1>
            <Button
              variant="outline"
              onClick={handleInitialize}
              className="flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Initialize from Code
            </Button>
          </div>

          {error && <ErrorAlert message={error} className="mb-4" />}

          {isLoading && enums?.length === 0 ? (
            <div className="flex justify-center py-12">
              <Loader size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enum List */}
              <div className="space-y-4">
                <Card>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Enum Types
                  </h2>
                  <div className="space-y-2">
                    {enumTypes.map((type) => {
                      const enumData = getEnumData(type.key);
                      const valueCount = enumData?.values?.length || 0;
                      return (
                        <div
                          key={type.key}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedEnumType === type.key
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                          onClick={() => handleEdit(type.key)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {type.label}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {type.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {valueCount} value{valueCount !== 1 ? "s" : ""}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(type.key);
                              }}
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Edit Panel */}
              <div key={selectedEnumType || "empty"}>
                {editingEnum ? (
                  <Card key={`edit-${editingEnum.enumType}`}>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Edit: {enumTypes.find((t) => t.key === editingEnum.enumType)?.label}
                      </h2>
                      <button
                        onClick={handleCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enum Type
                        </label>
                        <input
                          type="text"
                          value={editingEnum.enumType}
                          disabled
                          className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-500 min-h-[44px]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Values ({editingEnum.values.length})
                          </label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddValue(!showAddValue)}
                            className="flex items-center gap-1"
                          >
                            <Plus size={16} />
                            Add Value
                          </Button>
                        </div>

                        {showAddValue && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder="Enter new value"
                                className="flex-1 px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                                onKeyPress={(e) => {
                                  if (e.key === "Enter") {
                                    handleAddValue();
                                  }
                                }}
                              />
                              <Button
                                variant="primary"
                                onClick={handleAddValue}
                                className="min-h-[44px]"
                              >
                                Add
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setShowAddValue(false);
                                  setNewValue("");
                                }}
                                className="min-h-[44px]"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {editingEnum.values.map((value) => (
                            <div
                              key={`${editingEnum.enumType}-${value}`}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <span className="text-sm font-medium text-gray-900">
                                {value}
                              </span>
                              <button
                                onClick={() => handleRemoveValue(value)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                                disabled={editingEnum.values.length === 1}
                                title={
                                  editingEnum.values.length === 1
                                    ? "Cannot remove last value"
                                    : "Remove value"
                                }
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4 border-t">
                        <Button
                          variant="secondary"
                          onClick={handleCancel}
                          fullWidth
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="primary"
                          onClick={handleSave}
                          fullWidth
                          isLoading={isLoading}
                        >
                          <Save size={18} className="mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="text-center py-12 text-gray-500">
                      <p>Select an enum type from the list to edit</p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EnumManagement;


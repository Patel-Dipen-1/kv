import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { useEnums } from "../../hooks/useEnums";
import Button from "../../components/common/Button";
import { toast } from "react-toastify";

const FamilyMemberEditModal = ({ familyMember, onClose, onSave, isLoading }) => {
  const RELATIONSHIP_TYPES = useEnums("RELATIONSHIP_TYPES");
  const MARITAL_STATUS = useEnums("MARITAL_STATUS");
  const OCCUPATION_TYPES = useEnums("OCCUPATION_TYPES");
  const BLOOD_GROUPS = useEnums("BLOOD_GROUPS");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: {
      firstName: familyMember?.firstName || "",
      middleName: familyMember?.middleName || "",
      lastName: familyMember?.lastName || "",
      dateOfBirth: familyMember?.dateOfBirth
        ? new Date(familyMember.dateOfBirth).toISOString().split("T")[0]
        : "",
      age: familyMember?.age || "",
      mobileNumber: familyMember?.mobileNumber?.replace(/^\+91/, "") || "",
      email: familyMember?.email || "",
      relationshipToUser: familyMember?.relationshipToUser || "",
      maritalStatus: familyMember?.maritalStatus || "",
      occupationType: familyMember?.occupationType || "",
      occupationTitle: familyMember?.occupationTitle || "",
      qualification: familyMember?.qualification || "",
      bloodGroup: familyMember?.bloodGroup || "Unknown",
    },
  });

  const dateOfBirth = watch("dateOfBirth");

  // Auto-calculate age from date of birth
  useEffect(() => {
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      setValue("age", age);
    }
  }, [dateOfBirth, setValue]);

  const onSubmit = async (data) => {
    // Format mobile number if provided
    if (data.mobileNumber) {
      const cleaned = data.mobileNumber.replace(/^\+91/, "").replace(/\s/g, "");
      if (/^\d{10}$/.test(cleaned)) {
        data.mobileNumber = `+91${cleaned}`;
      } else {
        toast.error("Mobile number must be 10 digits");
        return;
      }
    } else {
      delete data.mobileNumber;
    }

    // Format email if provided
    if (data.email) {
      data.email = data.email.toLowerCase();
    } else {
      delete data.email;
    }

    // Remove empty fields
    Object.keys(data).forEach((key) => {
      if (data[key] === "" || data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    });

    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Family Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Relationship to User */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship <span className="text-red-500">*</span>
            </label>
            <select
              {...register("relationshipToUser", {
                required: "Relationship is required",
              })}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              <option value="">Select relationship</option>
              {RELATIONSHIP_TYPES.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
            {errors.relationshipToUser && (
              <p className="mt-1 text-sm text-red-600">
                {errors.relationshipToUser.message}
              </p>
            )}
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("firstName", {
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                {...register("middleName")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("lastName", {
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Date of Birth and Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                {...register("dateOfBirth")}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="number"
                {...register("age", {
                  min: { value: 0, message: "Age cannot be negative" },
                  max: { value: 120, message: "Age cannot exceed 120" },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                {...register("mobileNumber", {
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Mobile number must be 10 digits",
                  },
                })}
                placeholder="10 digits"
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.mobileNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.mobileNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Please enter a valid email",
                  },
                })}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          {/* Marital Status and Occupation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marital Status
              </label>
              <select
                {...register("maritalStatus")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">Select marital status</option>
                {MARITAL_STATUS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation Type
              </label>
              <select
                {...register("occupationType")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              >
                <option value="">Select occupation type</option>
                {OCCUPATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Occupation Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Occupation Title
              </label>
              <input
                type="text"
                {...register("occupationTitle")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification
              </label>
              <input
                type="text"
                {...register("qualification")}
                className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group
            </label>
            <select
              {...register("bloodGroup")}
              className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
            >
              {BLOOD_GROUPS && BLOOD_GROUPS.length > 0 ? (
                BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))
              ) : (
                <>
                  <option value="Unknown">Unknown</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </>
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyMemberEditModal;


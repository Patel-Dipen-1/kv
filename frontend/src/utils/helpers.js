// Format date to readable string
export const formatDate = (date) => {
  if (!date) return "N/A";
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Format date to YYYY-MM-DD for input fields
export const formatDateForInput = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

// Get status badge color
export const getStatusColor = (status) => {
  switch (status) {
    case "approved":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Get role badge color
export const getRoleColor = (role) => {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800";
    case "moderator":
      return "bg-blue-100 text-blue-800";
    case "user":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Format mobile number for display
export const formatMobileNumber = (mobile) => {
  if (!mobile) return "N/A";
  // Remove +91 if present
  const cleaned = mobile.replace(/^\+91/, "");
  // Format as XXX-XXX-XXXX
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return mobile;
};

// Get full name
export const getFullName = (user) => {
  if (!user) return "N/A";
  const parts = [user.firstName, user.middleName, user.lastName].filter(Boolean);
  return parts.join(" ") || "N/A";
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Get role display with position
export const getRoleDisplay = (user) => {
  if (!user || !user.role) return { role: "User", position: null };
  
  const role = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const position = user.role === "committee" ? user.committeePosition : null;
  
  return { role, position };
};

// Get role badge color
export const getRoleBadgeColor = (role) => {
  switch (role?.toLowerCase()) {
    case "admin":
      return "bg-red-100 text-red-800";
    case "moderator":
      return "bg-orange-100 text-orange-800";
    case "committee":
      return "bg-blue-100 text-blue-800";
    case "user":
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Get position badge color
export const getPositionBadgeColor = (position) => {
  const colors = {
    President: "bg-green-100 text-green-800",
    "Vice President": "bg-purple-100 text-purple-800",
    Secretary: "bg-green-100 text-green-800",
    Treasurer: "bg-yellow-100 text-yellow-800",
    "Committee Member": "bg-gray-100 text-gray-800",
    Advisor: "bg-indigo-100 text-indigo-800",
  };
  return colors[position] || "bg-gray-100 text-gray-800";
};


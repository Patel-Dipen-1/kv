import axiosInstance from "../api/axiosConfig";

/**
 * Download CSV file from API endpoint
 * @param {string} endpoint - API endpoint for export
 * @param {string} filename - Default filename for download
 */
export const downloadCSV = async (endpoint, filename) => {
  try {
    const response = await axiosInstance.get(endpoint, {
      responseType: "blob",
    });

    // Create blob and download
    const blob = new Blob([response.data], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `export-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to export data"
    );
  }
};

/**
 * Export all users
 */
export const exportAllUsers = () => {
  return downloadCSV("/admin/export/users", `all-users-${new Date().toISOString().split("T")[0]}.csv`);
};

/**
 * Export pending users
 */
export const exportPendingUsers = () => {
  return downloadCSV("/admin/export/pending-users", `pending-users-${new Date().toISOString().split("T")[0]}.csv`);
};

/**
 * Export family tree
 */
export const exportFamilyTree = (subFamilyNumber) => {
  return downloadCSV(
    `/admin/export/family-tree/${subFamilyNumber}`,
    `family-tree-${subFamilyNumber}-${new Date().toISOString().split("T")[0]}.csv`
  );
};

/**
 * Export committee members
 */
export const exportCommitteeMembers = () => {
  return downloadCSV("/admin/export/committee-members", `committee-members-${new Date().toISOString().split("T")[0]}.csv`);
};


/**
 * Centralized Permissions Constants
 * Single source of truth for all permissions in the application
 * Used by both backend and frontend
 * 
 * MAPPING GUIDE:
 * - Each route/page should have a corresponding permission
 * - Admin role should have ALL permissions set to true
 * - Use authorizePermission() middleware in routes
 * - Use usePermission() hook in frontend components
 */

const PERMISSIONS = {
  USER_MANAGEMENT: {
    CAN_VIEW_USERS: {
      key: "canViewUsers",
      label: "View Users",
      description: "Can see list of all users",
      category: "USER_MANAGEMENT",
    },
    CAN_APPROVE_USERS: {
      key: "canApproveUsers",
      label: "Approve Users",
      description: "Can approve pending registrations",
      category: "USER_MANAGEMENT",
    },
    CAN_REJECT_USERS: {
      key: "canRejectUsers",
      label: "Reject Users",
      description: "Can reject pending registrations",
      category: "USER_MANAGEMENT",
    },
    CAN_EDIT_USERS: {
      key: "canEditUsers",
      label: "Edit Users",
      description: "Can modify user details",
      category: "USER_MANAGEMENT",
    },
    CAN_DELETE_USERS: {
      key: "canDeleteUsers",
      label: "Delete Users",
      description: "Can remove users from system",
      category: "USER_MANAGEMENT",
    },
    CAN_CHANGE_ROLES: {
      key: "canChangeRoles",
      label: "Change User Roles",
      description: "Can assign roles to users",
      category: "USER_MANAGEMENT",
    },
    CAN_DEACTIVATE_USERS: {
      key: "canDeactivateUsers",
      label: "Deactivate Users",
      description: "Can deactivate user accounts",
      category: "USER_MANAGEMENT",
    },
    CAN_SEARCH_USERS: {
      key: "canSearchUsers",
      label: "Search Users",
      description: "Can search and filter users",
      category: "USER_MANAGEMENT",
    },
    CAN_BULK_APPROVE_USERS: {
      key: "canBulkApproveUsers",
      label: "Bulk Approve Users",
      description: "Can approve multiple users at once",
      category: "USER_MANAGEMENT",
    },
    CAN_BULK_REJECT_USERS: {
      key: "canBulkRejectUsers",
      label: "Bulk Reject Users",
      description: "Can reject multiple users at once",
      category: "USER_MANAGEMENT",
    },
    CAN_MANAGE_USERS: {
      key: "canManageUsers",
      label: "Manage Users",
      description: "Can transfer primary accounts and manage user relationships",
      category: "USER_MANAGEMENT",
    },
  },

  FAMILY_MANAGEMENT: {
    CAN_VIEW_FAMILY_MEMBERS: {
      key: "canViewFamilyMembers",
      label: "View Family Members",
      description: "Can see family member lists",
      category: "FAMILY_MANAGEMENT",
    },
    CAN_APPROVE_FAMILY_MEMBERS: {
      key: "canApproveFamilyMembers",
      label: "Approve Family Members",
      description: "Can approve family members (6+ member approval)",
      category: "FAMILY_MANAGEMENT",
    },
    CAN_REJECT_FAMILY_MEMBERS: {
      key: "canRejectFamilyMembers",
      label: "Reject Family Members",
      description: "Can reject family member requests",
      category: "FAMILY_MANAGEMENT",
    },
    CAN_EDIT_FAMILY_MEMBERS: {
      key: "canEditFamilyMembers",
      label: "Edit Family Members",
      description: "Can modify family member details",
      category: "FAMILY_MANAGEMENT",
    },
    CAN_DELETE_FAMILY_MEMBERS: {
      key: "canDeleteFamilyMembers",
      label: "Delete Family Members",
      description: "Can remove family members",
      category: "FAMILY_MANAGEMENT",
    },
    CAN_ADD_FAMILY_MEMBERS: {
      key: "canAddFamilyMembers",
      label: "Add Family Members",
      description: "Can add new family members",
      category: "FAMILY_MANAGEMENT",
    },
    CAN_VIEW_PENDING_FAMILY_MEMBERS: {
      key: "canViewPendingFamilyMembers",
      label: "View Pending Family Members",
      description: "Can see pending family member requests",
      category: "FAMILY_MANAGEMENT",
    },
    CAN_MANAGE_FAMILY_MEMBERS: {
      key: "canManageFamilyMembers",
      label: "Manage Family Members",
      description: "Can add/edit family members (only within own family)",
      category: "FAMILY_MANAGEMENT",
    },
  },

  COMMITTEE_MANAGEMENT: {
    CAN_MANAGE_COMMITTEE: {
      key: "canManageCommittee",
      label: "Manage Committee",
      description: "Can add/edit/delete committee members",
      category: "COMMITTEE_MANAGEMENT",
    },
    CAN_VIEW_COMMITTEE: {
      key: "canViewCommittee",
      label: "View Committee",
      description: "Can see committee members list",
      category: "COMMITTEE_MANAGEMENT",
    },
  },

  EVENT_MANAGEMENT: {
    CAN_CREATE_EVENTS: {
      key: "canCreateEvents",
      label: "Create Events",
      description: "Can add new events",
      category: "EVENT_MANAGEMENT",
    },
    CAN_EDIT_EVENTS: {
      key: "canEditEvents",
      label: "Edit Events",
      description: "Can modify existing events",
      category: "EVENT_MANAGEMENT",
    },
    CAN_DELETE_EVENTS: {
      key: "canDeleteEvents",
      label: "Delete Events",
      description: "Can remove events",
      category: "EVENT_MANAGEMENT",
    },
    CAN_VIEW_EVENTS: {
      key: "canViewEvents",
      label: "View Events",
      description: "Can see events list and details",
      category: "EVENT_MANAGEMENT",
    },
    CAN_MANAGE_EVENT_MEDIA: {
      key: "canManageEventMedia",
      label: "Manage Event Media",
      description: "Can upload/remove photos, videos, and YouTube links",
      category: "EVENT_MANAGEMENT",
    },
    CAN_MANAGE_EVENT_RSVP: {
      key: "canManageEventRSVP",
      label: "Manage Event RSVP",
      description: "Can view and export RSVP lists",
      category: "EVENT_MANAGEMENT",
    },
    CAN_MODERATE_EVENTS: {
      key: "canModerateEvents",
      label: "Moderate Events",
      description: "Can approve/reject event requests",
      category: "EVENT_MANAGEMENT",
    },
  },

  POLL_MANAGEMENT: {
    CAN_VIEW_POLLS: {
      key: "canViewPolls",
      label: "View Polls",
      description: "Can see polls on events",
      category: "POLL_MANAGEMENT",
    },
    CAN_VOTE_IN_POLLS: {
      key: "canVoteInPolls",
      label: "Vote in Polls",
      description: "Can cast votes in polls",
      category: "POLL_MANAGEMENT",
    },
    CAN_CREATE_POLLS: {
      key: "canCreatePolls",
      label: "Create Polls",
      description: "Can create new polls",
      category: "POLL_MANAGEMENT",
    },
    CAN_MANAGE_POLLS: {
      key: "canManagePolls",
      label: "Manage Polls",
      description: "Can edit/delete/close any poll",
      category: "POLL_MANAGEMENT",
    },
  },

  COMMENT_MANAGEMENT: {
    CAN_VIEW_COMMENTS: {
      key: "canViewComments",
      label: "View Comments",
      description: "Can see comments on events",
      category: "COMMENT_MANAGEMENT",
    },
    CAN_POST_COMMENTS: {
      key: "canPostComments",
      label: "Post Comments",
      description: "Can write comments on events",
      category: "COMMENT_MANAGEMENT",
    },
    CAN_MODERATE_COMMENTS: {
      key: "canModerateComments",
      label: "Moderate Comments",
      description: "Can approve/reject/delete any comments",
      category: "COMMENT_MANAGEMENT",
    },
    CAN_DELETE_ANY_COMMENT: {
      key: "canDeleteAnyComment",
      label: "Delete Any Comment",
      description: "Can delete any comment (admin only)",
      category: "COMMENT_MANAGEMENT",
    },
    CAN_DELETE_EVENTS: {
      key: "canDeleteEvents",
      label: "Delete Events",
      description: "Can remove events",
      category: "EVENT_MANAGEMENT",
    },
    CAN_VIEW_EVENTS: {
      key: "canViewEvents",
      label: "View Events",
      description: "Can see all events",
      category: "EVENT_MANAGEMENT",
    },
  },

  NOTIFICATION_MANAGEMENT: {
    CAN_SEND_NOTIFICATIONS: {
      key: "canSendNotifications",
      label: "Send Notifications",
      description: "Can send notifications to users",
      category: "NOTIFICATION_MANAGEMENT",
    },
    CAN_MANAGE_NOTIFICATIONS: {
      key: "canManageNotifications",
      label: "Manage Notifications",
      description: "Can edit/delete notifications",
      category: "NOTIFICATION_MANAGEMENT",
    },
  },

  MEDIA_MANAGEMENT: {
    CAN_UPLOAD_MEDIA: {
      key: "canUploadMedia",
      label: "Upload Media",
      description: "Can upload photos/videos",
      category: "MEDIA_MANAGEMENT",
    },
    CAN_DELETE_MEDIA: {
      key: "canDeleteMedia",
      label: "Delete Media",
      description: "Can remove media files",
      category: "MEDIA_MANAGEMENT",
    },
  },

  REPORTS_ANALYTICS: {
    CAN_VIEW_REPORTS: {
      key: "canViewReports",
      label: "View Reports",
      description: "Can access reports and analytics",
      category: "REPORTS_ANALYTICS",
    },
    CAN_EXPORT_DATA: {
      key: "canExportData",
      label: "Export Data",
      description: "Can export data to CSV/Excel",
      category: "REPORTS_ANALYTICS",
    },
    CAN_VIEW_STATS: {
      key: "canViewStats",
      label: "View Statistics",
      description: "Can view dashboard statistics",
      category: "REPORTS_ANALYTICS",
    },
  },

  SETTINGS: {
    CAN_MANAGE_SETTINGS: {
      key: "canManageSettings",
      label: "Manage App Settings",
      description: "Can modify application settings",
      category: "SETTINGS",
    },
    CAN_MANAGE_ROLES: {
      key: "canManageRoles",
      label: "Manage Roles",
      description: "Can create/edit/delete custom roles",
      category: "SETTINGS",
    },
    CAN_MANAGE_ENUMS: {
      key: "canManageEnums",
      label: "Manage Enums",
      description: "Can manage enum values and types",
      category: "SETTINGS",
    },
  },

  ACTIVITY_LOGS: {
    CAN_VIEW_ACTIVITY_LOGS: {
      key: "canViewActivityLogs",
      label: "View Activity Logs",
      description: "Can view system activity and audit logs",
      category: "ACTIVITY_LOGS",
    },
    CAN_MANAGE_ACTIVITY_LOGS: {
      key: "canManageActivityLogs",
      label: "Manage Activity Logs",
      description: "Can delete or manage activity logs",
      category: "ACTIVITY_LOGS",
    },
  },

  ADMIN_MANAGEMENT: {
    CAN_CREATE_ADMIN: {
      key: "canCreateAdmin",
      label: "Create Admin Users",
      description: "Can create new admin users",
      category: "ADMIN_MANAGEMENT",
    },
    CAN_MANAGE_ADMINS: {
      key: "canManageAdmins",
      label: "Manage Admin Users",
      description: "Can edit or remove admin users",
      category: "ADMIN_MANAGEMENT",
    },
  },
};

/**
 * Get all permission keys as flat array
 */
const getAllPermissionKeys = () => {
  const keys = [];
  Object.values(PERMISSIONS).forEach((category) => {
    Object.values(category).forEach((permission) => {
      keys.push(permission.key);
    });
  });
  return keys;
};

/**
 * Get all permissions as flat array with metadata
 */
const getAllPermissions = () => {
  const all = [];
  Object.values(PERMISSIONS).forEach((category) => {
    Object.values(category).forEach((permission) => {
      all.push(permission);
    });
  });
  return all;
};

/**
 * Get permissions grouped by category
 */
const getPermissionsByCategory = () => {
  return PERMISSIONS;
};

/**
 * Create default permissions object (all false)
 */
const createDefaultPermissions = () => {
  const defaultPerms = {};
  getAllPermissionKeys().forEach((key) => {
    defaultPerms[key] = false;
  });
  return defaultPerms;
};

/**
 * Validate permission key exists
 */
const isValidPermission = (permissionKey) => {
  return getAllPermissionKeys().includes(permissionKey);
};

module.exports = {
  PERMISSIONS,
  getAllPermissionKeys,
  getAllPermissions,
  getPermissionsByCategory,
  createDefaultPermissions,
  isValidPermission,
};

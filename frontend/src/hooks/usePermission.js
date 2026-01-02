import { useSelector } from "react-redux";

/**
 * Custom hook to check if current user has a specific permission
 * @param {string} permissionKey - The permission key to check (e.g., "canCreateEvents")
 * @returns {boolean} - True if user has the permission, false otherwise
 * 
 * @example
 * const canCreate = usePermission("canCreateEvents");
 * {canCreate && <Button>Create Event</Button>}
 */
export const usePermission = (permissionKey) => {
  const user = useSelector((state) => state.auth?.user);
  
  // If no user, no permissions
  if (!user) {
    return false;
  }

  // If user has roleRef populated with permissions
  if (user.roleRef && user.roleRef.permissions) {
    // Handle Map or Object
    if (user.roleRef.permissions instanceof Map) {
      return user.roleRef.permissions.get(permissionKey) === true;
    } else if (typeof user.roleRef.permissions === "object") {
      return user.roleRef.permissions[permissionKey] === true;
    }
  }

  // Fallback: If roleRef is just an ID, we need to check differently
  // For now, return false if we can't determine
  return false;
};

/**
 * Custom hook to check if current user has any of the specified permissions
 * @param {string[]} permissionKeys - Array of permission keys to check
 * @returns {boolean} - True if user has at least one permission
 * 
 * @example
 * const canManage = useAnyPermission(["canCreateEvents", "canEditEvents"]);
 */
export const useAnyPermission = (permissionKeys) => {
  const user = useSelector((state) => state.auth?.user);
  
  if (!user || !permissionKeys || permissionKeys.length === 0) {
    return false;
  }

  if (user.roleRef && user.roleRef.permissions) {
    const permissions = user.roleRef.permissions;
    
    return permissionKeys.some((key) => {
      if (permissions instanceof Map) {
        return permissions.get(key) === true;
      } else if (typeof permissions === "object") {
        return permissions[key] === true;
      }
      return false;
    });
  }

  return false;
};

/**
 * Custom hook to check if current user has all of the specified permissions
 * @param {string[]} permissionKeys - Array of permission keys to check
 * @returns {boolean} - True if user has all permissions
 * 
 * @example
 * const canFullManage = useAllPermissions(["canCreateEvents", "canEditEvents", "canDeleteEvents"]);
 */
export const useAllPermissions = (permissionKeys) => {
  const user = useSelector((state) => state.auth?.user);
  
  if (!user || !permissionKeys || permissionKeys.length === 0) {
    return false;
  }

  if (user.roleRef && user.roleRef.permissions) {
    const permissions = user.roleRef.permissions;
    
    return permissionKeys.every((key) => {
      if (permissions instanceof Map) {
        return permissions.get(key) === true;
      } else if (typeof permissions === "object") {
        return permissions[key] === true;
      }
      return false;
    });
  }

  return false;
};

/**
 * Get all user permissions as an object
 * @returns {Object} - Object with permission keys as keys and boolean values
 */
export const useUserPermissions = () => {
  const user = useSelector((state) => state.auth?.user);
  
  if (!user || !user.roleRef || !user.roleRef.permissions) {
    return {};
  }

  const permissions = user.roleRef.permissions;
  const result = {};

  if (permissions instanceof Map) {
    permissions.forEach((value, key) => {
      result[key] = value === true;
    });
  } else if (typeof permissions === "object") {
    Object.keys(permissions).forEach((key) => {
      result[key] = permissions[key] === true;
    });
  }

  return result;
};


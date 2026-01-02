import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

/**
 * Fetch all roles
 * GET /api/admin/roles
 */
export const getAllRoles = createAsyncThunk(
  "roles/getAllRoles",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/roles");
      return data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch roles"
      );
    }
  }
);

/**
 * Get single role by ID
 * GET /api/admin/roles/:id
 */
export const getRoleById = createAsyncThunk(
  "roles/getRoleById",
  async (roleId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/roles/${roleId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch role"
      );
    }
  }
);

/**
 * Create new role
 * POST /api/admin/roles
 */
export const createRole = createAsyncThunk(
  "roles/createRole",
  async (roleData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/roles", roleData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create role"
      );
    }
  }
);

/**
 * Update role
 * PATCH /api/admin/roles/:id
 */
export const updateRole = createAsyncThunk(
  "roles/updateRole",
  async ({ roleId, roleData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/admin/roles/${roleId}`,
        roleData
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update role"
      );
    }
  }
);

/**
 * Delete role
 * DELETE /api/admin/roles/:id
 */
export const deleteRole = createAsyncThunk(
  "roles/deleteRole",
  async (roleId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/roles/${roleId}`);
      return roleId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete role"
      );
    }
  }
);

/**
 * Assign role to user
 * PATCH /api/admin/roles/users/:userId/assign
 */
export const assignRoleToUser = createAsyncThunk(
  "roles/assignRoleToUser",
  async ({ userId, roleId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/admin/roles/users/${userId}/assign`,
        { roleId }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to assign role"
      );
    }
  }
);

/**
 * Get all available permissions
 * GET /api/admin/permissions
 */
export const getAllPermissions = createAsyncThunk(
  "roles/getAllPermissions",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/permissions");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch permissions"
      );
    }
  }
);

/**
 * Initialize system roles
 * POST /api/admin/roles/initialize
 */
export const initializeSystemRoles = createAsyncThunk(
  "roles/initializeSystemRoles",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/roles/initialize");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to initialize roles"
      );
    }
  }
);

const initialState = {
  roles: [],
  currentRole: null,
  permissions: null,
  isLoading: false,
  error: null,
};

const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentRole: (state) => {
      state.currentRole = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all roles
      .addCase(getAllRoles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllRoles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = action.payload;
      })
      .addCase(getAllRoles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get role by ID
      .addCase(getRoleById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRoleById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRole = action.payload;
      })
      .addCase(getRoleById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create role
      .addCase(createRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update role
      .addCase(updateRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateRole.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.roles.findIndex(
          (r) => r._id === action.payload._id
        );
        if (index !== -1) {
          state.roles[index] = action.payload;
        }
        if (state.currentRole?._id === action.payload._id) {
          state.currentRole = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete role
      .addCase(deleteRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = state.roles.filter((r) => r._id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get all permissions
      .addCase(getAllPermissions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllPermissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissions = action.payload;
      })
      .addCase(getAllPermissions.rejected, (state) => {
        state.isLoading = false;
      })
      // Initialize system roles
      .addCase(initializeSystemRoles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeSystemRoles.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(initializeSystemRoles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentRole } = roleSlice.actions;
export default roleSlice.reducer;


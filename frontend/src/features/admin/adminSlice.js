import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

// Async thunks
export const getPendingUsers = createAsyncThunk(
  "admin/getPendingUsers",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users", {
        params: { status: "pending", page, limit },
      });
      return {
        users: data.users,
        total: data.total,
        page: data.page,
        pages: data.pages,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch pending users"
      );
    }
  }
);

export const getApprovedUsers = createAsyncThunk(
  "admin/getApprovedUsers",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users", {
        params: { status: "approved", page, limit },
      });
      return {
        users: data.users,
        total: data.total,
        page: data.page,
        pages: data.pages,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch approved users"
      );
    }
  }
);

export const getRejectedUsers = createAsyncThunk(
  "admin/getRejectedUsers",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users", {
        params: { status: "rejected", page, limit },
      });
      return {
        users: data.users,
        total: data.total,
        page: data.page,
        pages: data.pages,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch rejected users"
      );
    }
  }
);

export const getUserStats = createAsyncThunk(
  "admin/getUserStats",
  async (_, { rejectWithValue }) => {
    try {
      // Fetch counts for each status
      const [pending, approved, rejected] = await Promise.all([
        axiosInstance.get("/users", { params: { status: "pending", limit: 1 } }),
        axiosInstance.get("/users", { params: { status: "approved", limit: 1 } }),
        axiosInstance.get("/users", { params: { status: "rejected", limit: 1 } }),
      ]);
      return {
        pending: pending.data.total || 0,
        approved: approved.data.total || 0,
        rejected: rejected.data.total || 0,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch user stats"
      );
    }
  }
);

export const approveUser = createAsyncThunk(
  "admin/approveUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/users/${userId}/approve`);
      return {
        user: data.user,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to approve user"
      );
    }
  }
);

export const rejectUser = createAsyncThunk(
  "admin/rejectUser",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/users/${userId}/reject`);
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to reject user"
      );
    }
  }
);

/**
 * Bulk approve users
 */
export const bulkApproveUsers = createAsyncThunk(
  "admin/bulkApproveUsers",
  async (userIds, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch("/users/bulk-approve", {
        userIds,
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to approve users"
      );
    }
  }
);

/**
 * Bulk reject users
 */
export const bulkRejectUsers = createAsyncThunk(
  "admin/bulkRejectUsers",
  async (userIds, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch("/users/bulk-reject", {
        userIds,
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to reject users"
      );
    }
  }
);

/**
 * Get activity logs
 */
export const getActivityLogs = createAsyncThunk(
  "admin/getActivityLogs",
  async ({ page = 1, limit = 20, actionType, startDate, endDate, performedBy, targetUser }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/activity-logs", {
        params: { page, limit, actionType, startDate, endDate, performedBy, targetUser },
      });
      return {
        logs: data.data,
        total: data.total,
        page: data.page,
        pages: data.pages,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch activity logs"
      );
    }
  }
);

/**
 * Enum Management
 */
export const getAllEnums = createAsyncThunk(
  "admin/getAllEnums",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/enums");
      return data.enums;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch enums"
      );
    }
  }
);

export const getEnumByType = createAsyncThunk(
  "admin/getEnumByType",
  async (enumType, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/admin/enums/${enumType}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch enum"
      );
    }
  }
);

export const createOrUpdateEnum = createAsyncThunk(
  "admin/createOrUpdateEnum",
  async ({ enumType, values, description }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/enums", {
        enumType,
        values,
        description,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to update enum"
      );
    }
  }
);

export const addEnumValue = createAsyncThunk(
  "admin/addEnumValue",
  async ({ enumType, value }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/enums/${enumType}/add-value`, {
        value,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to add enum value"
      );
    }
  }
);

export const removeEnumValue = createAsyncThunk(
  "admin/removeEnumValue",
  async ({ enumType, value }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/enums/${enumType}/remove-value`, {
        value,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to remove enum value"
      );
    }
  }
);

export const initializeEnums = createAsyncThunk(
  "admin/initializeEnums",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/admin/enums/initialize");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to initialize enums"
      );
    }
  }
);

export const getUserById = createAsyncThunk(
  "admin/getUserById",
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/users/${userId}`);
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch user"
      );
    }
  }
);

export const updateUserRole = createAsyncThunk(
  "admin/updateUserRole",
  async ({ userId, role, committeePosition, committeeDisplayOrder, committeeBio }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/users/${userId}/role`, {
        role,
        committeePosition,
        committeeDisplayOrder,
        committeeBio,
      });
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to update user role"
      );
    }
  }
);

export const getCommitteeMembers = createAsyncThunk(
  "admin/getCommitteeMembers",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users/committee-members");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch committee members"
      );
    }
  }
);

export const searchUsers = createAsyncThunk(
  "admin/searchUsers",
  async ({ q, role, status, samaj, country, startDate, endDate, minAge, maxAge, minFamilySize, maxFamilySize, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users/search", {
        params: { q, role, status, samaj, country, startDate, endDate, minAge, maxAge, minFamilySize, maxFamilySize, page, limit },
      });
      return {
        users: data.users,
        total: data.total,
        page: data.page,
        pages: data.pages,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to search users"
      );
    }
  }
);

/**
 * Transfer primary account ownership
 */
export const transferPrimaryAccount = createAsyncThunk(
  "admin/transferPrimaryAccount",
  async ({ userId, newPrimaryUserId, reason, familyMemberIds }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/users/admin/${userId}/transfer-primary`,
        { newPrimaryUserId, reason, familyMemberIds }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to transfer primary account"
      );
    }
  }
);

/**
 * Delete user (hard delete)
 * DELETE /api/users/:id/hard
 */
export const deleteUser = createAsyncThunk(
  "admin/deleteUser",
  async ({ userId, deletionReason, deleteDependentData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.delete(`/users/${userId}/hard`, {
        data: { deletionReason, deleteDependentData },
      });
      return { userId, ...data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to delete user"
      );
    }
  }
);

/**
 * Get family members by subFamilyNumber
 * GET /api/users/family/:subFamilyNumber
 */
export const getFamilyMembers = createAsyncThunk(
  "admin/getFamilyMembers",
  async (subFamilyNumber, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/users/family/${subFamilyNumber}`);
      return data.familyMembers || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch family members"
      );
    }
  }
);

/**
 * Get family members for transfer
 * GET /api/users/:id/family-for-transfer
 */
export const getFamilyMembersForTransfer = createAsyncThunk(
  "admin/getFamilyMembersForTransfer",
  async (userId, { rejectWithValue }) => {
    try {
      // Ensure userId is a string
      const cleanUserId = typeof userId === 'string' ? userId : String(userId);
      if (!cleanUserId || cleanUserId.includes('[object') || cleanUserId.includes('Object')) {
        throw new Error("Invalid user ID");
      }
      
      const { data } = await axiosInstance.get(`/users/${encodeURIComponent(cleanUserId.trim())}/family-for-transfer`);
      return data.data || data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        error.message ||
        "Failed to fetch family members for transfer"
      );
    }
  }
);

/**
 * Get all users and family members
 * GET /api/users/admin/all-users
 */
export const getAllUsersAndFamilyMembers = createAsyncThunk(
  "admin/getAllUsersAndFamilyMembers",
  async ({ page = 1, limit = 20, type, status, approvalStatus, search, subFamilyNumber }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users/admin/all-users", {
        params: { page, limit, type, status, approvalStatus, search, subFamilyNumber },
      });
      return {
        items: data.data,
        total: data.total,
        page: data.page,
        pages: data.pages,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch users and family members"
      );
    }
  }
);

/**
 * Update family member (Admin)
 * PATCH /api/admin/family-members/:id
 */
export const adminUpdateFamilyMember = createAsyncThunk(
  "admin/adminUpdateFamilyMember",
  async ({ id, updateData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/family-members/${id}`, updateData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to update family member"
      );
    }
  }
);

/**
 * Delete family member (Admin)
 * DELETE /api/admin/family-members/:id
 */
export const adminDeleteFamilyMember = createAsyncThunk(
  "admin/adminDeleteFamilyMember",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/admin/family-members/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to delete family member"
      );
    }
  }
);

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    pendingUsers: [],
    approvedUsers: [],
    rejectedUsers: [],
    familyMembers: [],
    allUsersAndFamilyMembers: [],
    stats: { pending: 0, approved: 0, rejected: 0 },
    currentPage: { pending: 1, approved: 1, rejected: 1, activityLogs: 1, allUsers: 1 },
    totalPages: { pending: 1, approved: 1, rejected: 1, activityLogs: 1, allUsers: 1 },
    total: { pending: 0, approved: 0, rejected: 0, activityLogs: 0, allUsers: 0 },
    isLoading: false,
    error: null,
    selectedUser: null,
    committeeMembers: [],
    nextPendingUser: null,
    activityLogs: [],
    enums: [],
    searchResults: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
  },
  extraReducers: (builder) => {
    // Get Pending Users
    builder
      .addCase(getPendingUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPendingUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingUsers = action.payload.users;
        state.currentPage.pending = action.payload.page;
        state.totalPages.pending = action.payload.pages;
        state.total.pending = action.payload.total;
        state.error = null;
      })
      .addCase(getPendingUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Approved Users
    builder
      .addCase(getApprovedUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getApprovedUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.approvedUsers = action.payload.users;
        state.currentPage.approved = action.payload.page;
        state.totalPages.approved = action.payload.pages;
        state.total.approved = action.payload.total;
        state.error = null;
      })
      .addCase(getApprovedUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Rejected Users
    builder
      .addCase(getRejectedUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRejectedUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rejectedUsers = action.payload.users;
        state.currentPage.rejected = action.payload.page;
        state.totalPages.rejected = action.payload.pages;
        state.total.rejected = action.payload.total;
        state.error = null;
      })
      .addCase(getRejectedUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get User Stats
    builder
      .addCase(getUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(getUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Approve User
    builder
      .addCase(approveUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove from pending, add to approved
        state.pendingUsers = state.pendingUsers.filter(
          (u) => u._id !== action.payload._id
        );
        state.approvedUsers.unshift(action.payload);
        state.stats.pending = Math.max(0, state.stats.pending - 1);
        state.stats.approved += 1;
        state.error = null;
        // Store next pending user for auto-redirect
        if (action.meta?.arg?.nextPendingUser) {
          state.nextPendingUser = action.meta.arg.nextPendingUser;
        }
      })
      .addCase(approveUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Reject User
    builder
      .addCase(rejectUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove from pending, add to rejected
        state.pendingUsers = state.pendingUsers.filter(
          (u) => u._id !== action.payload._id
        );
        state.rejectedUsers.unshift(action.payload);
        state.stats.pending = Math.max(0, state.stats.pending - 1);
        state.stats.rejected += 1;
        state.error = null;
      })
      .addCase(rejectUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

    // Bulk Approve Users
    builder
      .addCase(bulkApproveUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkApproveUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove approved users from pending list
        const approvedIds = action.meta.arg;
        state.pendingUsers = state.pendingUsers.filter(
          (u) => !approvedIds.includes(u._id)
        );
        state.stats.pending = Math.max(0, state.stats.pending - approvedIds.length);
        state.stats.approved += approvedIds.length;
        state.error = null;
      })
      .addCase(bulkApproveUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

    // Bulk Reject Users
    builder
      .addCase(bulkRejectUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkRejectUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove rejected users from pending list
        const rejectedIds = action.meta.arg;
        state.pendingUsers = state.pendingUsers.filter(
          (u) => !rejectedIds.includes(u._id)
        );
        state.stats.pending = Math.max(0, state.stats.pending - rejectedIds.length);
        state.stats.rejected += rejectedIds.length;
        state.error = null;
      })
      .addCase(bulkRejectUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

    // Get Activity Logs
    builder
      .addCase(getActivityLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getActivityLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activityLogs = action.payload.logs;
        state.currentPage.activityLogs = action.payload.page;
        state.totalPages.activityLogs = action.payload.pages;
        state.total.activityLogs = action.payload.total;
        state.error = null;
      })
      .addCase(getActivityLogs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

    // Enum Management
    builder
      .addCase(getAllEnums.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllEnums.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enums = action.payload;
        state.error = null;
      })
      .addCase(getAllEnums.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getEnumByType.fulfilled, (state, action) => {
        // Update specific enum in the list
        const index = state.enums.findIndex((e) => e.enumType === action.payload.enumType);
        if (index !== -1) {
          state.enums[index] = action.payload;
        } else {
          state.enums.push(action.payload);
        }
      })
      .addCase(createOrUpdateEnum.fulfilled, (state, action) => {
        const index = state.enums.findIndex((e) => e.enumType === action.payload.enumType);
        if (index !== -1) {
          state.enums[index] = action.payload;
        } else {
          state.enums.push(action.payload);
        }
      })
      .addCase(addEnumValue.fulfilled, (state, action) => {
        const index = state.enums.findIndex((e) => e.enumType === action.payload.enumType);
        if (index !== -1) {
          state.enums[index] = action.payload;
        }
      })
      .addCase(removeEnumValue.fulfilled, (state, action) => {
        const index = state.enums.findIndex((e) => e.enumType === action.payload.enumType);
        if (index !== -1) {
          state.enums[index] = action.payload;
        }
      })
      .addCase(initializeEnums.fulfilled, (state, action) => {
        state.enums = action.payload;
      });

    // Get User By ID
    builder
      .addCase(getUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUser = action.payload;
        state.error = null;
      })
      .addCase(getUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update User Role
    builder
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update user in relevant lists
        const updatedUser = action.payload;
        state.pendingUsers = state.pendingUsers.map((u) =>
          u._id === updatedUser._id ? updatedUser : u
        );
        state.approvedUsers = state.approvedUsers.map((u) =>
          u._id === updatedUser._id ? updatedUser : u
        );
        state.rejectedUsers = state.rejectedUsers.map((u) =>
          u._id === updatedUser._id ? updatedUser : u
        );
        if (state.selectedUser?._id === updatedUser._id) {
          state.selectedUser = updatedUser;
        }
        state.error = null;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Committee Members
    builder
      .addCase(getCommitteeMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCommitteeMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.committeeMembers = action.payload;
        state.error = null;
      })
      .addCase(getCommitteeMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Search Users
    builder
      .addCase(searchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
        state.error = null;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Transfer Primary Account
    builder
      .addCase(transferPrimaryAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(transferPrimaryAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
      })
      .addCase(transferPrimaryAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete User
    builder
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove deleted user from approved users list
        state.approvedUsers = state.approvedUsers.filter(
          (user) => user._id !== action.payload.userId
        );
        state.total.approved = Math.max(0, state.total.approved - 1);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Family Members
    builder
      .addCase(getFamilyMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFamilyMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.familyMembers = action.payload;
      })
      .addCase(getFamilyMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Family Members For Transfer
    builder
      .addCase(getFamilyMembersForTransfer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFamilyMembersForTransfer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(getFamilyMembersForTransfer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get All Users And Family Members
    builder
      .addCase(getAllUsersAndFamilyMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllUsersAndFamilyMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allUsersAndFamilyMembers = action.payload.items;
        state.currentPage.allUsers = action.payload.page;
        state.totalPages.allUsers = action.payload.pages;
        state.total.allUsers = action.payload.total;
        state.error = null;
      })
      .addCase(getAllUsersAndFamilyMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Admin Update Family Member
    builder
      .addCase(adminUpdateFamilyMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminUpdateFamilyMember.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update in allUsersAndFamilyMembers list
        state.allUsersAndFamilyMembers = state.allUsersAndFamilyMembers.map((item) =>
          item._id === action.payload._id ? action.payload : item
        );
        state.error = null;
      })
      .addCase(adminUpdateFamilyMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Admin Delete Family Member
    builder
      .addCase(adminDeleteFamilyMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(adminDeleteFamilyMember.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove from allUsersAndFamilyMembers list
        state.allUsersAndFamilyMembers = state.allUsersAndFamilyMembers.filter(
          (item) => item._id !== action.payload
        );
        state.total.allUsers = Math.max(0, state.total.allUsers - 1);
        state.error = null;
      })
      .addCase(adminDeleteFamilyMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedUser, clearSelectedUser } =
  adminSlice.actions;
export default adminSlice.reducer;


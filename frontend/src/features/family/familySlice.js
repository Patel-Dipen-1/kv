import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

// Async thunks
export const getMyFamilyMembers = createAsyncThunk(
  "family/getMyFamilyMembers",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/family-members/my");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch family members"
      );
    }
  }
);

export const addFamilyMember = createAsyncThunk(
  "family/addFamilyMember",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/family-members", formData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to add family member"
      );
    }
  }
);

export const updateFamilyMember = createAsyncThunk(
  "family/updateFamilyMember",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/family-members/${id}`, formData);
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

export const deleteFamilyMember = createAsyncThunk(
  "family/deleteFamilyMember",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/family-members/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to delete family member"
      );
    }
  }
);

export const getPendingFamilyMembers = createAsyncThunk(
  "family/getPendingFamilyMembers",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/family-members/pending", {
        params: { page, limit },
      });
      return {
        members: data.data,
        total: data.total,
        page: data.page,
        pages: data.pages,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to fetch pending family members"
      );
    }
  }
);

export const approveFamilyMember = createAsyncThunk(
  "family/approveFamilyMember",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/family-members/${id}/approve`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to approve family member"
      );
    }
  }
);

export const rejectFamilyMember = createAsyncThunk(
  "family/rejectFamilyMember",
  async (id, { rejectWithValue }) => {
    try {
      await axiosInstance.patch(`/family-members/${id}/reject`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        "Failed to reject family member"
      );
    }
  }
);

// Get combined family members (Users + FamilyMembers) by subFamilyNumber
export const getCombinedFamilyMembers = createAsyncThunk(
  "family/getCombinedFamilyMembers",
  async ({ subFamilyNumber, page = 1, limit = 10, search = "", type = "all" }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        type,
      });
      const { data } = await axiosInstance.get(
        `/users/family-complete/${subFamilyNumber}?${params.toString()}`
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch family members"
      );
    }
  }
);

const familySlice = createSlice({
  name: "family",
  initialState: {
    myFamilyMembers: [],
    pendingFamilyMembers: [],
    combinedFamilyMembers: [],
    combinedCurrentPage: 1,
    combinedTotalPages: 1,
    combinedTotal: 0,
    currentPage: 1,
    totalPages: 1,
    total: 0,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Get My Family Members
    builder
      .addCase(getMyFamilyMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyFamilyMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myFamilyMembers = action.payload;
        state.error = null;
      })
      .addCase(getMyFamilyMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Add Family Member
    builder
      .addCase(addFamilyMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addFamilyMember.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data.approvalStatus === "approved") {
          state.myFamilyMembers.push(action.payload.data);
        }
        state.error = null;
      })
      .addCase(addFamilyMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update Family Member
    builder
      .addCase(updateFamilyMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFamilyMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myFamilyMembers = state.myFamilyMembers.map((member) =>
          member._id === action.payload._id ? action.payload : member
        );
        state.error = null;
      })
      .addCase(updateFamilyMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Delete Family Member
    builder
      .addCase(deleteFamilyMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteFamilyMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myFamilyMembers = state.myFamilyMembers.filter(
          (member) => member._id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteFamilyMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Pending Family Members
    builder
      .addCase(getPendingFamilyMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPendingFamilyMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingFamilyMembers = action.payload.members;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.pages;
        state.total = action.payload.total;
        state.error = null;
      })
      .addCase(getPendingFamilyMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Approve Family Member
    builder
      .addCase(approveFamilyMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveFamilyMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingFamilyMembers = state.pendingFamilyMembers.filter(
          (member) => member._id !== action.payload._id
        );
        state.total = Math.max(0, state.total - 1);
        state.error = null;
      })
      .addCase(approveFamilyMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Reject Family Member
    builder
      .addCase(rejectFamilyMember.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectFamilyMember.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingFamilyMembers = state.pendingFamilyMembers.filter(
          (member) => member._id !== action.payload
        );
        state.total = Math.max(0, state.total - 1);
        state.error = null;
      })
      .addCase(rejectFamilyMember.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Get Combined Family Members
    builder
      .addCase(getCombinedFamilyMembers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCombinedFamilyMembers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.combinedFamilyMembers = action.payload.members || [];
        state.combinedCurrentPage = action.payload.pagination?.currentPage || 1;
        state.combinedTotalPages = action.payload.pagination?.totalPages || 1;
        state.combinedTotal = action.payload.pagination?.total || 0;
        state.error = null;
      })
      .addCase(getCombinedFamilyMembers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = familySlice.actions;
export default familySlice.reducer;


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

// Async thunks
export const createFamilyMemberRequest = createAsyncThunk(
  "familyRequest/createFamilyMemberRequest",
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/family-member-requests", formData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to create family member request"
      );
    }
  }
);

export const getMyFamilyMemberRequests = createAsyncThunk(
  "familyRequest/getMyFamilyMemberRequests",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/family-member-requests");
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch family member requests"
      );
    }
  }
);

export const getAllFamilyMemberRequests = createAsyncThunk(
  "familyRequest/getAllFamilyMemberRequests",
  async ({ status, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/family-member-requests/admin", {
        params: { status, page, limit },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch family member requests"
      );
    }
  }
);

export const approveFamilyMemberRequest = createAsyncThunk(
  "familyRequest/approveFamilyMemberRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/family-member-requests/admin/${requestId}/approve`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to approve family member request"
      );
    }
  }
);

export const rejectFamilyMemberRequest = createAsyncThunk(
  "familyRequest/rejectFamilyMemberRequest",
  async ({ requestId, rejectionReason }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/family-member-requests/admin/${requestId}/reject`,
        { rejectionReason }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to reject family member request"
      );
    }
  }
);

const initialState = {
  myRequests: [],
  allRequests: [],
  currentPage: 1,
  totalPages: 1,
  total: 0,
  isLoading: false,
  error: null,
  message: null,
};

const familyRequestSlice = createSlice({
  name: "familyRequest",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create request
      .addCase(createFamilyMemberRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createFamilyMemberRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        state.myRequests.push(action.payload.data);
      })
      .addCase(createFamilyMemberRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get my requests
      .addCase(getMyFamilyMemberRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyFamilyMemberRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myRequests = action.payload;
      })
      .addCase(getMyFamilyMemberRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get all requests (admin)
      .addCase(getAllFamilyMemberRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllFamilyMemberRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allRequests = action.payload.data;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.pages;
        state.total = action.payload.total;
      })
      .addCase(getAllFamilyMemberRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Approve request
      .addCase(approveFamilyMemberRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(approveFamilyMemberRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        // Update request status in list
        const index = state.allRequests.findIndex(
          (r) => r._id === action.payload.data.request._id
        );
        if (index !== -1) {
          state.allRequests[index] = action.payload.data.request;
        }
      })
      .addCase(approveFamilyMemberRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reject request
      .addCase(rejectFamilyMemberRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectFamilyMemberRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        // Update request status in list
        const index = state.allRequests.findIndex(
          (r) => r._id === action.payload.data._id
        );
        if (index !== -1) {
          state.allRequests[index] = action.payload.data;
        }
      })
      .addCase(rejectFamilyMemberRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMessage } = familyRequestSlice.actions;
export default familyRequestSlice.reducer;


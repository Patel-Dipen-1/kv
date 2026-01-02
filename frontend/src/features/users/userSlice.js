import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

// Async thunks
export const getMyProfile = createAsyncThunk(
  "users/getMyProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users/me");
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch profile"
      );
    }
  }
);

export const updateMyProfile = createAsyncThunk(
  "users/updateMyProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch("/users/me", profileData);
      // Update localStorage user if needed
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const updatedUser = { ...user, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to update profile"
      );
    }
  }
);

/**
 * Change password
 */
export const changePassword = createAsyncThunk(
  "users/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch("/users/change-password", {
        currentPassword,
        newPassword,
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to change password"
      );
    }
  }
);

const userSlice = createSlice({
  name: "users",
  initialState: {
    profile: null,
    isLoading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // Get My Profile
    builder
      .addCase(getMyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getMyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Update My Profile
    builder
      .addCase(updateMyProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateMyProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(updateMyProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = false;
      })

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearSuccess } = userSlice.actions;
export default userSlice.reducer;


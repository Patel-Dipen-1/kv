import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

// Async thunks
export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/auth/register", userData);
      // Phase 1 registration doesn't return token - user must wait for approval
      // Return success message only
      return { message: data.message || "Registration submitted. Waiting for approval." };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Registration failed"
      );
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async ({ emailOrMobile, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/auth/login", {
        emailOrMobile,
        password,
      });
      // Store token and user in localStorage
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return { user: data.user, token: data.token };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Login failed"
      );
    }
  }
);

export const completeProfile = createAsyncThunk(
  "auth/completeProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/auth/complete-profile", profileData);
      // Update user in localStorage
      if (data.user) {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...data.user };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      return { user: data.user, message: data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to complete profile"
      );
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/auth/forgot-password", {
        email,
      });
      return data.message || "Password reset token generated";
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to send reset email"
      );
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/auth/reset-password/${token}`,
        { password }
      );
      // Store token and user if auto-login is enabled
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return { user: data.user, token: data.token, message: data.message };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Password reset failed"
      );
    }
  }
);

// Initial state - try to restore from localStorage
const getInitialState = () => {
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  let user = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
      // Ensure roleRef.permissions is an object (not Map) for compatibility
      if (user && user.roleRef && user.roleRef.permissions) {
        // If permissions is somehow still a Map-like structure, convert it
        if (user.roleRef.permissions.constructor === Object) {
          // Already an object, good
        } else {
          // Convert Map-like structure to object
          const permissionsObj = {};
          if (user.roleRef.permissions.forEach) {
            user.roleRef.permissions.forEach((value, key) => {
              permissionsObj[key] = value;
            });
            user.roleRef.permissions = permissionsObj;
          }
        }
      }
    } catch (e) {
      localStorage.removeItem("user");
    }
  }

  return {
    user: user,
    token: token,
    isLoading: false,
    error: null,
    isAuthenticated: !!token && !!user,
    message: null,
  };
};

const authSlice = createSlice({
  name: "auth",
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      // Ensure roleRef.permissions is an object (not Map) for compatibility
      if (user && user.roleRef && user.roleRef.permissions) {
        if (user.roleRef.permissions.constructor !== Object) {
          // Convert Map-like structure to object
          const permissionsObj = {};
          if (user.roleRef.permissions.forEach) {
            user.roleRef.permissions.forEach((value, key) => {
              permissionsObj[key] = value;
            });
            user.roleRef.permissions = permissionsObj;
          }
        }
      }
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.message = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message || "Registration submitted. Waiting for approval.";
        state.error = null;
        // Don't set isAuthenticated - user must wait for approval
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload.user;
        // Ensure roleRef.permissions is an object (not Map) for compatibility
        if (user && user.roleRef && user.roleRef.permissions) {
          if (user.roleRef.permissions.constructor !== Object) {
            // Convert Map-like structure to object
            const permissionsObj = {};
            if (user.roleRef.permissions.forEach) {
              user.roleRef.permissions.forEach((value, key) => {
                permissionsObj[key] = value;
              });
              user.roleRef.permissions = permissionsObj;
            }
          }
        }
        state.user = user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.message = action.payload.message || "Login successful";
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // Forgot Password
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Reset Password
    builder
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.token) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
        }
        state.message = action.payload.message || "Password reset successful";
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Complete Profile
    builder
      .addCase(completeProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        const user = action.payload.user;
        // Ensure roleRef.permissions is an object (not Map) for compatibility
        if (user && user.roleRef && user.roleRef.permissions) {
          if (user.roleRef.permissions.constructor !== Object) {
            const permissionsObj = {};
            if (user.roleRef.permissions.forEach) {
              user.roleRef.permissions.forEach((value, key) => {
                permissionsObj[key] = value;
              });
              user.roleRef.permissions = permissionsObj;
            }
          }
        }
        state.user = user;
        state.message = action.payload.message || "Profile completed successfully";
        state.error = null;
        // Update localStorage
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }
      })
      .addCase(completeProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setCredentials, logout, clearError, clearMessage } =
  authSlice.actions;
export default authSlice.reducer;


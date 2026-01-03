import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

/**
 * Search users and families by name or Family ID
 */
export const searchFamily = createAsyncThunk(
  "search/searchFamily",
  async ({ q }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/users/search-family", {
        params: { q },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to search"
      );
    }
  }
);

/**
 * Get family members for a specific user (on-demand fetch)
 */
export const getUserFamilyMembers = createAsyncThunk(
  "search/getUserFamilyMembers",
  async ({ userId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/users/${userId}/family-members`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to fetch family members"
      );
    }
  }
);

const searchSlice = createSlice({
  name: "search",
  initialState: {
    searchResults: [],
    searchType: null,
    query: "",
    isLoading: false,
    error: null,
  },
  reducers: {
    clearSearch: (state) => {
      state.searchResults = [];
      state.searchType = null;
      state.query = "";
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchFamily.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchFamily.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.results || [];
        state.searchType = action.payload.searchType;
        state.query = action.payload.query;
        state.error = null;
      })
      .addCase(searchFamily.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.searchResults = [];
      });
  },
});

export const { clearSearch, clearError } = searchSlice.actions;
export default searchSlice.reducer;


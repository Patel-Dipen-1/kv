import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";
import * as staticEnums from "../../constants/enums"; // Fallback to static enums

/**
 * Fetch all enums from backend
 * This will be called on app load to get dynamic enum values
 */
export const fetchEnums = createAsyncThunk(
  "enums/fetchEnums",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/admin/enums");
      // Backend returns { success: true, enums: [...] }
      // We need to convert the enums array to an object format
      const enumMap = {};
      if (data.enums && Array.isArray(data.enums)) {
        data.enums.forEach((enumItem) => {
          if (enumItem.enumType && enumItem.values) {
            enumMap[enumItem.enumType] = enumItem.values;
          }
        });
      } else if (data.data) {
        // If data.data is the enum map
        Object.assign(enumMap, data.data);
      }
      return enumMap;
    } catch (error) {
      // If API fails, return null to use static enums as fallback
      // Don't reject, just return null so components can use static enums
      console.warn("Failed to fetch dynamic enums, using static fallback:", error.message);
      return null;
    }
  }
);

const initialState = {
  enums: null, // null means use static enums
  isLoading: false,
  error: null,
  lastFetched: null,
};

const enumSlice = createSlice({
  name: "enums",
  initialState,
  reducers: {
    clearEnums: (state) => {
      state.enums = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnums.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEnums.fulfilled, (state, action) => {
        state.isLoading = false;
        state.enums = action.payload;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchEnums.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Keep enums as null to use static fallback
      });
  },
});

export const { clearEnums } = enumSlice.actions;
export default enumSlice.reducer;

/**
 * Helper hook/selector to get enum values
 * Returns dynamic enums if available, otherwise static enums
 */
export const getEnumValues = (enumType) => (state) => {
  if (state.enums?.enums?.[enumType]) {
    return state.enums.enums[enumType];
  }
  // Fallback to static enums
  return staticEnums[enumType] || [];
};

/**
 * Helper to get all enums
 */
export const getAllEnums = (state) => {
  if (state.enums?.enums) {
    return state.enums.enums;
  }
  // Fallback to static enums
  return staticEnums;
};


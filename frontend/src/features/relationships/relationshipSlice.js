import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

// Async thunks
export const sendConnectionRequest = createAsyncThunk(
  "relationships/sendRequest",
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_URL}/user-relationships`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to send connection request"
      );
    }
  }
);

export const getRelationships = createAsyncThunk(
  "relationships/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${API_URL}/user-relationships${queryParams ? `?${queryParams}` : ""}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch relationships"
      );
    }
  }
);

export const acceptRelationship = createAsyncThunk(
  "relationships/accept",
  async (relationshipId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/user-relationships/${relationshipId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to accept relationship"
      );
    }
  }
);

export const rejectRelationship = createAsyncThunk(
  "relationships/reject",
  async (relationshipId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${API_URL}/user-relationships/${relationshipId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reject relationship"
      );
    }
  }
);

export const deleteRelationship = createAsyncThunk(
  "relationships/delete",
  async (relationshipId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/user-relationships/${relationshipId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return relationshipId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete relationship"
      );
    }
  }
);

export const getFamilyTree = createAsyncThunk(
  "relationships/getFamilyTree",
  async (userId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/user-relationships/family-tree/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch family tree"
      );
    }
  }
);

const relationshipSlice = createSlice({
  name: "relationships",
  initialState: {
    relationships: [],
    familyTree: [],
    isLoading: false,
    error: null,
    message: null,
  },
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
      // Send request
      .addCase(sendConnectionRequest.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendConnectionRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        state.relationships.push(action.payload.data);
      })
      .addCase(sendConnectionRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get relationships
      .addCase(getRelationships.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getRelationships.fulfilled, (state, action) => {
        state.isLoading = false;
        state.relationships = action.payload.data || [];
      })
      .addCase(getRelationships.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Accept relationship
      .addCase(acceptRelationship.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(acceptRelationship.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        const index = state.relationships.findIndex(
          (r) => r._id === action.payload.data._id
        );
        if (index !== -1) {
          state.relationships[index] = action.payload.data;
        }
      })
      .addCase(acceptRelationship.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Reject relationship
      .addCase(rejectRelationship.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rejectRelationship.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = action.payload.message;
        state.relationships = state.relationships.filter(
          (r) => r._id !== action.payload.relationshipId
        );
      })
      .addCase(rejectRelationship.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete relationship
      .addCase(deleteRelationship.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteRelationship.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = "Relationship deleted successfully";
        state.relationships = state.relationships.filter(
          (r) => r._id !== action.payload
        );
      })
      .addCase(deleteRelationship.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get family tree
      .addCase(getFamilyTree.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getFamilyTree.fulfilled, (state, action) => {
        state.isLoading = false;
        state.familyTree = action.payload.data || [];
      })
      .addCase(getFamilyTree.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMessage } = relationshipSlice.actions;
export default relationshipSlice.reducer;


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

/**
 * Get all events
 * GET /api/events
 */
export const getAllEvents = createAsyncThunk(
  "events/getAllEvents",
  async ({ page = 1, limit = 20, eventType, visibility } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (page) params.append("page", page);
      if (limit) params.append("limit", limit);
      if (eventType) params.append("eventType", eventType);
      if (visibility) params.append("visibility", visibility);

      const { data } = await axiosInstance.get(`/events?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch events"
      );
    }
  }
);

/**
 * Get single event
 * GET /api/events/:id
 */
export const getEventById = createAsyncThunk(
  "events/getEventById",
  async (eventId, { rejectWithValue }) => {
    try {
      // Ensure eventId is a string
      const id = typeof eventId === 'string' ? eventId : String(eventId?._id || eventId?.id || eventId);
      if (!id) {
        return rejectWithValue("Event ID is required");
      }
      const { data } = await axiosInstance.get(`/events/${id}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch event"
      );
    }
  }
);

/**
 * Create event (Admin only)
 * POST /api/events
 */
export const createEvent = createAsyncThunk(
  "events/createEvent",
  async (eventData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/events", eventData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create event"
      );
    }
  }
);

/**
 * Update event (Admin only)
 * PUT /api/events/:id
 */
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async ({ eventId, eventData }, { rejectWithValue }) => {
    try {
      // Ensure eventId is a string
      const id = typeof eventId === 'string' ? eventId : String(eventId?._id || eventId?.id || eventId);
      if (!id) {
        return rejectWithValue("Event ID is required");
      }
      const { data } = await axiosInstance.put(`/events/${id}`, eventData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update event"
      );
    }
  }
);

/**
 * Delete event (Admin only)
 * DELETE /api/events/:id
 */
export const deleteEvent = createAsyncThunk(
  "events/deleteEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      // Ensure eventId is a string
      const id = typeof eventId === 'string' ? eventId : String(eventId?._id || eventId?.id || eventId);
      if (!id) {
        return rejectWithValue("Event ID is required");
      }
      await axiosInstance.delete(`/events/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete event"
      );
    }
  }
);

/**
 * Toggle like
 * POST /api/events/:id/like
 */
export const toggleLike = createAsyncThunk(
  "events/toggleLike",
  async (eventId, { rejectWithValue }) => {
    try {
      // Ensure eventId is a string
      const id = typeof eventId === 'string' ? eventId : String(eventId?._id || eventId?.id || eventId);
      if (!id) {
        return rejectWithValue("Event ID is required");
      }
      const { data } = await axiosInstance.post(`/events/${id}/like`);
      return { eventId: id, ...data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle like"
      );
    }
  }
);

/**
 * Add comment
 * POST /api/events/:id/comment
 */
export const addComment = createAsyncThunk(
  "events/addComment",
  async ({ eventId, text }, { rejectWithValue }) => {
    try {
      // Ensure eventId is a string
      const id = typeof eventId === 'string' ? eventId : String(eventId?._id || eventId?.id || eventId);
      if (!id) {
        return rejectWithValue("Event ID is required");
      }
      const { data } = await axiosInstance.post(`/events/${id}/comment`, { text });
      return { eventId: id, comment: data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add comment"
      );
    }
  }
);

/**
 * Delete comment
 * DELETE /api/events/:id/comment/:commentId
 */
export const deleteComment = createAsyncThunk(
  "events/deleteComment",
  async ({ eventId, commentId }, { rejectWithValue }) => {
    try {
      // Ensure eventId and commentId are strings
      const id = typeof eventId === 'string' ? eventId : String(eventId?._id || eventId?.id || eventId);
      const cId = typeof commentId === 'string' ? commentId : String(commentId?._id || commentId?.id || commentId);
      if (!id || !cId) {
        return rejectWithValue("Event ID and Comment ID are required");
      }
      await axiosInstance.delete(`/events/${id}/comment/${cId}`);
      return { eventId: id, commentId: cId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete comment"
      );
    }
  }
);

/**
 * Vote in poll
 * POST /api/events/:id/vote
 */
export const voteInPoll = createAsyncThunk(
  "events/voteInPoll",
  async ({ eventId, optionId }, { rejectWithValue }) => {
    try {
      // Ensure eventId and optionId are strings
      const id = typeof eventId === 'string' ? eventId : String(eventId?._id || eventId?.id || eventId);
      const optId = typeof optionId === 'string' ? optionId : String(optionId?._id || optionId?.id || optionId);
      if (!id || !optId) {
        return rejectWithValue("Event ID and Option ID are required");
      }
      const { data } = await axiosInstance.post(`/events/${id}/vote`, { optionId: optId });
      return { eventId: id, ...data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to vote"
      );
    }
  }
);

const initialState = {
  events: [],
  currentEvent: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all events
      .addCase(getAllEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        const newPage = action.payload.page || 1;
        // If loading page 1, replace events. Otherwise, append for infinite scroll
        if (newPage === 1) {
          state.events = action.payload.data || [];
        } else {
          // Append new events, avoiding duplicates
          const existingIds = new Set(state.events.map(e => e._id));
          const newEvents = (action.payload.data || []).filter(e => !existingIds.has(e._id));
          state.events = [...state.events, ...newEvents];
        }
        state.pagination = {
          page: newPage,
          limit: action.payload.limit || 20,
          total: action.payload.total || 0,
          pages: action.payload.pages || 0,
        };
      })
      .addCase(getAllEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get event by ID
      .addCase(getEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(getEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create event
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events.unshift(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update event
      .addCase(updateEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.events.findIndex(
          (e) => e._id === action.payload._id
        );
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.currentEvent?._id === action.payload._id) {
          state.currentEvent = action.payload;
        }
      })
      .addCase(updateEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Delete event
      .addCase(deleteEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = state.events.filter((e) => e._id !== action.payload);
        if (state.currentEvent?._id === action.payload) {
          state.currentEvent = null;
        }
      })
      .addCase(deleteEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Toggle like
      .addCase(toggleLike.fulfilled, (state, action) => {
        const event = state.events.find((e) => e._id === action.payload.eventId);
        if (event) {
          event.likeCount = action.payload.likeCount;
        }
        if (state.currentEvent?._id === action.payload.eventId) {
          state.currentEvent.likeCount = action.payload.likeCount;
          // Update likes array
          if (action.payload.isLiked) {
            state.currentEvent.likes.push({ userId: action.payload.userId });
          } else {
            state.currentEvent.likes = state.currentEvent.likes.filter(
              (like) => like.userId._id !== action.payload.userId
            );
          }
        }
      })
      // Add comment
      .addCase(addComment.fulfilled, (state, action) => {
        if (state.currentEvent?._id === action.payload.eventId) {
          state.currentEvent.comments.push(action.payload.comment);
          state.currentEvent.commentCount += 1;
        }
      })
      // Delete comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        if (state.currentEvent?._id === action.payload.eventId) {
          state.currentEvent.comments = state.currentEvent.comments.filter(
            (c) => c._id !== action.payload.commentId
          );
          state.currentEvent.commentCount = Math.max(
            0,
            state.currentEvent.commentCount - 1
          );
        }
      })
      // Vote in poll
      .addCase(voteInPoll.fulfilled, (state, action) => {
        if (state.currentEvent?._id === action.payload.eventId) {
          state.currentEvent.poll = action.payload.poll;
        }
      });
  },
});

export const { clearError, clearCurrentEvent } = eventSlice.actions;
export default eventSlice.reducer;


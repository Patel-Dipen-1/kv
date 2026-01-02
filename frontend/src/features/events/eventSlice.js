import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

/**
 * Create new event
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
 * Get all events
 * GET /api/events
 */
export const getAllEvents = createAsyncThunk(
  "events/getAllEvents",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
          if (Array.isArray(filters[key])) {
            filters[key].forEach((val) => params.append(key, val));
          } else {
            params.append(key, filters[key]);
          }
        }
      });

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
 * Get single event by ID
 * GET /api/events/:id
 */
export const getEventById = createAsyncThunk(
  "events/getEventById",
  async (eventId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/events/${eventId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch event"
      );
    }
  }
);

/**
 * Update event
 * PATCH /api/events/:id
 */
export const updateEvent = createAsyncThunk(
  "events/updateEvent",
  async ({ eventId, eventData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/events/${eventId}`, eventData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update event"
      );
    }
  }
);

/**
 * Delete event
 * DELETE /api/events/:id
 */
export const deleteEvent = createAsyncThunk(
  "events/deleteEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/events/${eventId}`);
      return eventId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete event"
      );
    }
  }
);

/**
 * Add media to event
 * POST /api/events/:id/media
 */
export const addEventMedia = createAsyncThunk(
  "events/addEventMedia",
  async ({ eventId, mediaType, mediaData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/events/${eventId}/media`, {
        mediaType,
        mediaData,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add media"
      );
    }
  }
);

/**
 * Remove media from event
 * DELETE /api/events/:id/media/:mediaId
 */
export const removeEventMedia = createAsyncThunk(
  "events/removeEventMedia",
  async ({ eventId, mediaId, mediaType }, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/events/${eventId}/media/${mediaId}?mediaType=${mediaType}`);
      return { eventId, mediaId, mediaType };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove media"
      );
    }
  }
);

/**
 * RSVP to event
 * POST /api/events/:id/rsvp
 */
export const rsvpToEvent = createAsyncThunk(
  "events/rsvpToEvent",
  async ({ eventId, response }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/events/${eventId}/rsvp`, {
        response,
      });
      return { eventId, rsvpCounts: data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to record RSVP"
      );
    }
  }
);

/**
 * Get my events
 * GET /api/events/my
 */
export const getMyEvents = createAsyncThunk(
  "events/getMyEvents",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const { data } = await axiosInstance.get(`/events/my?${params.toString()}`);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch your events"
      );
    }
  }
);

const initialState = {
  events: [],
  currentEvent: null,
  myEvents: [],
  isLoading: false,
  error: null,
  filters: {
    eventType: "",
    status: "",
    startDate: "",
    endDate: "",
    city: "",
    search: "",
  },
  pagination: {
    page: 1,
    limit: 50, // Increased to show more events
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
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
  },
  extraReducers: (builder) => {
    builder
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
      // Get all events
      .addCase(getAllEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.pages ? action.payload.total / action.payload.pages : 20,
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
      // Add media
      .addCase(addEventMedia.fulfilled, (state, action) => {
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
      // Remove media
      .addCase(removeEventMedia.fulfilled, (state, action) => {
        const event = state.events.find((e) => e._id === action.payload.eventId);
        if (event) {
          if (action.payload.mediaType === "photo") {
            event.photos = event.photos.filter(
              (p) => p._id.toString() !== action.payload.mediaId
            );
          } else if (action.payload.mediaType === "video") {
            event.videos = event.videos.filter(
              (v) => v._id.toString() !== action.payload.mediaId
            );
          } else if (action.payload.mediaType === "youtube") {
            event.youtubeLinks = event.youtubeLinks.filter(
              (l) => l._id.toString() !== action.payload.mediaId
            );
          }
        }
      })
      // RSVP
      .addCase(rsvpToEvent.fulfilled, (state, action) => {
        const event = state.events.find((e) => e._id === action.payload.eventId);
        if (event) {
          event.rsvpCounts = action.payload.rsvpCounts;
        }
        if (state.currentEvent?._id === action.payload.eventId) {
          state.currentEvent.rsvpCounts = action.payload.rsvpCounts;
        }
      })
      // Get my events
      .addCase(getMyEvents.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMyEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myEvents = action.payload.data || [];
      })
      .addCase(getMyEvents.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearError, clearCurrentEvent, setFilters, resetFilters } =
  eventSlice.actions;
export default eventSlice.reducer;


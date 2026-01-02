import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

/**
 * Create new poll
 * POST /api/polls
 */
export const createPoll = createAsyncThunk(
  "polls/createPoll",
  async (pollData, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/polls", pollData);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create poll"
      );
    }
  }
);

/**
 * Get polls for an event
 * GET /api/polls/event/:eventId
 */
export const getPollsByEvent = createAsyncThunk(
  "polls/getPollsByEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/polls/event/${eventId}`);
      return data.data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch polls"
      );
    }
  }
);

/**
 * Get single poll by ID
 * GET /api/polls/:pollId
 */
export const getPollById = createAsyncThunk(
  "polls/getPollById",
  async (pollId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(`/polls/${pollId}`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch poll"
      );
    }
  }
);

/**
 * Vote on poll
 * POST /api/polls/:pollId/vote
 */
export const voteOnPoll = createAsyncThunk(
  "polls/voteOnPoll",
  async ({ pollId, optionIds }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/polls/${pollId}/vote`, {
        optionIds,
      });
      return { pollId, ...data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to vote"
      );
    }
  }
);

/**
 * Change vote
 * PATCH /api/polls/:pollId/vote
 */
export const changeVote = createAsyncThunk(
  "polls/changeVote",
  async ({ pollId, optionIds }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/polls/${pollId}/vote`, {
        optionIds,
      });
      return { pollId, ...data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to change vote"
      );
    }
  }
);

/**
 * Close poll
 * PATCH /api/polls/:pollId/close
 */
export const closePoll = createAsyncThunk(
  "polls/closePoll",
  async (pollId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/polls/${pollId}/close`);
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to close poll"
      );
    }
  }
);

/**
 * Delete poll
 * DELETE /api/polls/:pollId
 */
export const deletePoll = createAsyncThunk(
  "polls/deletePoll",
  async (pollId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/polls/${pollId}`);
      return pollId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete poll"
      );
    }
  }
);

const initialState = {
  polls: [],
  currentPoll: null,
  isLoading: false,
  error: null,
};

const pollSlice = createSlice({
  name: "polls",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentPoll: (state) => {
      state.currentPoll = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create poll
      .addCase(createPoll.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPoll.fulfilled, (state, action) => {
        state.isLoading = false;
        state.polls.unshift(action.payload);
      })
      .addCase(createPoll.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get polls by event
      .addCase(getPollsByEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPollsByEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.polls = action.payload;
      })
      .addCase(getPollsByEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get poll by ID
      .addCase(getPollById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getPollById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPoll = action.payload;
        // Update in polls array if exists
        const index = state.polls.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.polls[index] = action.payload;
        }
      })
      .addCase(getPollById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Vote on poll
      .addCase(voteOnPoll.fulfilled, (state, action) => {
        const poll = state.polls.find((p) => p._id === action.payload.pollId);
        if (poll) {
          poll.userHasVoted = true;
          poll.userVote = action.payload.userVote;
          poll.totalVotes = action.payload.totalVotes;
        }
        if (state.currentPoll?._id === action.payload.pollId) {
          state.currentPoll.userHasVoted = true;
          state.currentPoll.userVote = action.payload.userVote;
          state.currentPoll.totalVotes = action.payload.totalVotes;
        }
      })
      // Change vote
      .addCase(changeVote.fulfilled, (state, action) => {
        const poll = state.polls.find((p) => p._id === action.payload.pollId);
        if (poll) {
          poll.userVote = action.payload.userVote;
          poll.totalVotes = action.payload.totalVotes;
        }
        if (state.currentPoll?._id === action.payload.pollId) {
          state.currentPoll.userVote = action.payload.userVote;
          state.currentPoll.totalVotes = action.payload.totalVotes;
        }
      })
      // Close poll
      .addCase(closePoll.fulfilled, (state, action) => {
        const index = state.polls.findIndex(
          (p) => p._id === action.payload._id
        );
        if (index !== -1) {
          state.polls[index] = action.payload;
        }
        if (state.currentPoll?._id === action.payload._id) {
          state.currentPoll = action.payload;
        }
      })
      // Delete poll
      .addCase(deletePoll.fulfilled, (state, action) => {
        state.polls = state.polls.filter((p) => p._id !== action.payload);
        if (state.currentPoll?._id === action.payload) {
          state.currentPoll = null;
        }
      });
  },
});

export const { clearError, clearCurrentPoll } = pollSlice.actions;
export default pollSlice.reducer;


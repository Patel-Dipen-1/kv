import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosConfig";

/**
 * Create comment
 * POST /api/comments/events/:eventId/comments
 */
export const createComment = createAsyncThunk(
  "comments/createComment",
  async ({ eventId, commentData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/comments/events/${eventId}/comments`,
        commentData
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to post comment"
      );
    }
  }
);

/**
 * Get comments for an event
 * GET /api/comments/events/:eventId/comments
 */
export const getCommentsByEvent = createAsyncThunk(
  "comments/getCommentsByEvent",
  async ({ eventId, page = 1, limit = 50, sort = "recent" }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/comments/events/${eventId}/comments?page=${page}&limit=${limit}&sort=${sort}`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch comments"
      );
    }
  }
);

/**
 * Update comment
 * PATCH /api/comments/:commentId
 */
export const updateComment = createAsyncThunk(
  "comments/updateComment",
  async ({ commentId, commentText }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(`/comments/${commentId}`, {
        commentText,
      });
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update comment"
      );
    }
  }
);

/**
 * Delete comment
 * DELETE /api/comments/:commentId
 */
export const deleteComment = createAsyncThunk(
  "comments/deleteComment",
  async (commentId, { rejectWithValue }) => {
    try {
      await axiosInstance.delete(`/comments/${commentId}`);
      return commentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete comment"
      );
    }
  }
);

/**
 * Like/Unlike comment
 * POST /api/comments/:commentId/like
 */
export const likeComment = createAsyncThunk(
  "comments/likeComment",
  async (commentId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(`/comments/${commentId}/like`);
      return { commentId, ...data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to like comment"
      );
    }
  }
);

/**
 * Reply to comment
 * POST /api/comments/:commentId/reply
 */
export const replyToComment = createAsyncThunk(
  "comments/replyToComment",
  async ({ commentId, replyData }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/comments/${commentId}/reply`,
        replyData
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to post reply"
      );
    }
  }
);

/**
 * Report comment
 * POST /api/comments/:commentId/report
 */
export const reportComment = createAsyncThunk(
  "comments/reportComment",
  async ({ commentId, reason, details }, { rejectWithValue }) => {
    try {
      await axiosInstance.post(`/comments/${commentId}/report`, {
        reason,
        details,
      });
      return commentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to report comment"
      );
    }
  }
);

/**
 * Get pending comments (admin)
 * GET /api/comments/admin/pending
 */
export const getPendingComments = createAsyncThunk(
  "comments/getPendingComments",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/comments/admin/pending?page=${page}&limit=${limit}`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch pending comments"
      );
    }
  }
);

/**
 * Get flagged comments (admin)
 * GET /api/comments/admin/flagged
 */
export const getFlaggedComments = createAsyncThunk(
  "comments/getFlaggedComments",
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get(
        `/comments/admin/flagged?page=${page}&limit=${limit}`
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch flagged comments"
      );
    }
  }
);

/**
 * Moderate comment (admin)
 * PATCH /api/comments/admin/:commentId/approve
 */
export const moderateComment = createAsyncThunk(
  "comments/moderateComment",
  async ({ commentId, action }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.patch(
        `/comments/admin/${commentId}/approve`,
        { action }
      );
      return data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to moderate comment"
      );
    }
  }
);

const initialState = {
  comments: [],
  pendingComments: [],
  flaggedComments: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  },
};

const commentSlice = createSlice({
  name: "comments",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearComments: (state) => {
      state.comments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Create comment
      .addCase(createComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comments.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Get comments by event
      .addCase(getCommentsByEvent.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCommentsByEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.comments = action.payload.data || [];
        state.pagination = {
          page: action.payload.page || 1,
          limit: action.payload.pages
            ? action.payload.total / action.payload.pages
            : 50,
          total: action.payload.total || 0,
          pages: action.payload.pages || 0,
        };
      })
      .addCase(getCommentsByEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update comment
      .addCase(updateComment.fulfilled, (state, action) => {
        const index = state.comments.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) {
          state.comments[index] = action.payload;
        }
      })
      // Delete comment
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.comments = state.comments.filter((c) => c._id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      // Like comment
      .addCase(likeComment.fulfilled, (state, action) => {
        const comment = state.comments.find(
          (c) => c._id === action.payload.commentId
        );
        if (comment) {
          comment.likeCount = action.payload.likeCount;
          comment.userLiked = action.payload.isLiked;
        }
      })
      // Reply to comment
      .addCase(replyToComment.fulfilled, (state, action) => {
        const parentComment = state.comments.find(
          (c) => c._id === action.payload.parentCommentId?._id
        );
        if (parentComment) {
          if (!parentComment.replies) {
            parentComment.replies = [];
          }
          parentComment.replies.push(action.payload);
          parentComment.replyCount = (parentComment.replyCount || 0) + 1;
        }
      })
      // Get pending comments
      .addCase(getPendingComments.fulfilled, (state, action) => {
        state.pendingComments = action.payload.data || [];
      })
      // Get flagged comments
      .addCase(getFlaggedComments.fulfilled, (state, action) => {
        state.flaggedComments = action.payload.data || [];
      })
      // Moderate comment
      .addCase(moderateComment.fulfilled, (state, action) => {
        state.pendingComments = state.pendingComments.filter(
          (c) => c._id !== action.payload._id
        );
        state.flaggedComments = state.flaggedComments.filter(
          (c) => c._id !== action.payload._id
        );
      });
  },
});

export const { clearError, clearComments } = commentSlice.actions;
export default commentSlice.reducer;


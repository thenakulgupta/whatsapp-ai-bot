import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Async thunks
export const fetchChats = createAsyncThunk(
  "chats/fetchChats",
  async (
    { moduleId, limit = 50, skip = 0, status = null },
    { rejectWithValue }
  ) => {
    try {
      const params = { moduleId, limit, skip };
      if (status) params.status = status;

      const response = await api.get("/chats", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch chats"
      );
    }
  }
);

export const fetchChatHistory = createAsyncThunk(
  "chats/fetchChatHistory",
  async ({ userId, moduleId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chats/${userId}/history`, {
        params: { moduleId },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch chat history"
      );
    }
  }
);

export const escalateChat = createAsyncThunk(
  "chats/escalateChat",
  async ({ chatId, reason, priority = "medium" }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chats/${chatId}/escalate`, {
        reason,
        priority,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to escalate chat"
      );
    }
  }
);

export const updateChatStatus = createAsyncThunk(
  "chats/updateChatStatus",
  async ({ chatId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/chats/${chatId}/status`, { status });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update chat status"
      );
    }
  }
);

const initialState = {
  chats: [],
  currentChat: null,
  chatHistory: [],
  loading: false,
  error: null,
  pagination: {
    page: 0,
    limit: 50,
    total: 0,
    hasMore: false,
  },
};

const chatSlice = createSlice({
  name: "chats",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    addNewChat: (state, action) => {
      state.chats.unshift(action.payload);
    },
    updateChat: (state, action) => {
      const { chatId, updates } = action.payload;
      const index = state.chats.findIndex((chat) => chat.id === chatId);
      if (index !== -1) {
        state.chats[index] = { ...state.chats[index], ...updates };
      }
    },
    addChatMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (state.currentChat && state.currentChat.id === chatId) {
        state.currentChat.messages = state.currentChat.messages || [];
        state.currentChat.messages.push(message);
      }
    },
    updateMessageStatus: (state, action) => {
      const { messageId, status } = action.payload;
      if (state.currentChat && state.currentChat.messages) {
        const message = state.currentChat.messages.find(
          (msg) => msg.id === messageId
        );
        if (message) {
          message.status = status;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch chats
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload.chats || [];
        state.pagination = {
          page: action.payload.page || 0,
          limit: action.payload.limit || 50,
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false,
        };
        state.error = null;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch chat history
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.chatHistory = action.payload.messages || [];
        state.error = null;
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Escalate chat
      .addCase(escalateChat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(escalateChat.fulfilled, (state, action) => {
        state.loading = false;
        const chat = state.chats.find(
          (chat) => chat.id === action.payload.chatId
        );
        if (chat) {
          chat.isEscalated = true;
          chat.escalatedAt = action.payload.escalatedAt;
          chat.ticketId = action.payload.ticketId;
        }
        state.error = null;
      })
      .addCase(escalateChat.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update chat status
      .addCase(updateChatStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateChatStatus.fulfilled, (state, action) => {
        state.loading = false;
        const chat = state.chats.find(
          (chat) => chat.id === action.payload.chatId
        );
        if (chat) {
          chat.status = action.payload.status;
        }
        state.error = null;
      })
      .addCase(updateChatStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentChat,
  addNewChat,
  updateChat,
  addChatMessage,
  updateMessageStatus,
} = chatSlice.actions;

// Selectors
export const selectChats = (state) => state.chats.chats;
export const selectCurrentChat = (state) => state.chats.currentChat;
export const selectChatHistory = (state) => state.chats.chatHistory;
export const selectChatsLoading = (state) => state.chats.loading;
export const selectChatsError = (state) => state.chats.error;
export const selectChatsPagination = (state) => state.chats.pagination;

export default chatSlice.reducer;

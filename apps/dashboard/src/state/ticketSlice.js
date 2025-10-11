import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Async thunks
export const fetchTickets = createAsyncThunk(
  "tickets/fetchTickets",
  async (
    { moduleId, status = null, limit = 50, skip = 0 },
    { rejectWithValue }
  ) => {
    try {
      const params = { moduleId, limit, skip };
      if (status) params.status = status;

      const response = await api.get("/tickets", { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch tickets"
      );
    }
  }
);

export const fetchTicket = createAsyncThunk(
  "tickets/fetchTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch ticket"
      );
    }
  }
);

export const assignTicket = createAsyncThunk(
  "tickets/assignTicket",
  async ({ ticketId, agentId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/assign`, {
        agentId,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to assign ticket"
      );
    }
  }
);

export const updateTicket = createAsyncThunk(
  "tickets/updateTicket",
  async ({ ticketId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/tickets/${ticketId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update ticket"
      );
    }
  }
);

export const resolveTicket = createAsyncThunk(
  "tickets/resolveTicket",
  async ({ ticketId, resolution }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/resolve`, {
        resolution,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to resolve ticket"
      );
    }
  }
);

export const closeTicket = createAsyncThunk(
  "tickets/closeTicket",
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/tickets/${ticketId}/close`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to close ticket"
      );
    }
  }
);

const initialState = {
  tickets: [],
  currentTicket: null,
  loading: false,
  error: null,
  pagination: {
    page: 0,
    limit: 50,
    total: 0,
    hasMore: false,
  },
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
    },
    addNewTicket: (state, action) => {
      state.tickets.unshift(action.payload);
    },
    updateTicketInList: (state, action) => {
      const { ticketId, updates } = action.payload;
      const index = state.tickets.findIndex((ticket) => ticket.id === ticketId);
      if (index !== -1) {
        state.tickets[index] = { ...state.tickets[index], ...updates };
      }
    },
    addTicketNote: (state, action) => {
      const { ticketId, note } = action.payload;
      const ticket = state.tickets.find((ticket) => ticket.id === ticketId);
      if (ticket) {
        ticket.notes = ticket.notes || [];
        ticket.notes.push(note);
      }

      if (state.currentTicket && state.currentTicket.id === ticketId) {
        state.currentTicket.notes = state.currentTicket.notes || [];
        state.currentTicket.notes.push(note);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tickets
      .addCase(fetchTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload.tickets || [];
        state.pagination = {
          page: action.payload.page || 0,
          limit: action.payload.limit || 50,
          total: action.payload.total || 0,
          hasMore: action.payload.hasMore || false,
        };
        state.error = null;
      })
      .addCase(fetchTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch ticket
      .addCase(fetchTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.currentTicket = action.payload;
        state.error = null;
      })
      .addCase(fetchTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Assign ticket
      .addCase(assignTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignTicket.fulfilled, (state, action) => {
        state.loading = false;
        const ticket = state.tickets.find(
          (ticket) => ticket.id === action.payload.ticketId
        );
        if (ticket) {
          ticket.assignedTo = action.payload.assignedTo;
          ticket.assignedAt = action.payload.assignedAt;
          ticket.status = "assigned";
        }

        if (
          state.currentTicket &&
          state.currentTicket.id === action.payload.ticketId
        ) {
          state.currentTicket.assignedTo = action.payload.assignedTo;
          state.currentTicket.assignedAt = action.payload.assignedAt;
          state.currentTicket.status = "assigned";
        }

        state.error = null;
      })
      .addCase(assignTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update ticket
      .addCase(updateTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTicket.fulfilled, (state, action) => {
        state.loading = false;
        const ticket = state.tickets.find(
          (ticket) => ticket.id === action.payload.id
        );
        if (ticket) {
          Object.assign(ticket, action.payload);
        }

        if (
          state.currentTicket &&
          state.currentTicket.id === action.payload.id
        ) {
          Object.assign(state.currentTicket, action.payload);
        }

        state.error = null;
      })
      .addCase(updateTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Resolve ticket
      .addCase(resolveTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resolveTicket.fulfilled, (state, action) => {
        state.loading = false;
        const ticket = state.tickets.find(
          (ticket) => ticket.id === action.payload.ticketId
        );
        if (ticket) {
          ticket.status = "resolved";
          ticket.resolvedAt = action.payload.resolvedAt;
          ticket.resolution = action.payload.resolution;
        }

        if (
          state.currentTicket &&
          state.currentTicket.id === action.payload.ticketId
        ) {
          state.currentTicket.status = "resolved";
          state.currentTicket.resolvedAt = action.payload.resolvedAt;
          state.currentTicket.resolution = action.payload.resolution;
        }

        state.error = null;
      })
      .addCase(resolveTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Close ticket
      .addCase(closeTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeTicket.fulfilled, (state, action) => {
        state.loading = false;
        const ticket = state.tickets.find(
          (ticket) => ticket.id === action.payload.ticketId
        );
        if (ticket) {
          ticket.status = "closed";
          ticket.closedAt = action.payload.closedAt;
        }

        if (
          state.currentTicket &&
          state.currentTicket.id === action.payload.ticketId
        ) {
          state.currentTicket.status = "closed";
          state.currentTicket.closedAt = action.payload.closedAt;
        }

        state.error = null;
      })
      .addCase(closeTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentTicket,
  addNewTicket,
  updateTicketInList,
  addTicketNote,
} = ticketSlice.actions;

// Selectors
export const selectTickets = (state) => state.tickets.tickets;
export const selectCurrentTicket = (state) => state.tickets.currentTicket;
export const selectTicketsLoading = (state) => state.tickets.loading;
export const selectTicketsError = (state) => state.tickets.error;
export const selectTicketsPagination = (state) => state.tickets.pagination;

export default ticketSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Async thunks
export const fetchAgents = createAsyncThunk(
  "agents/fetchAgents",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/agents");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch agents"
      );
    }
  }
);

export const fetchAgent = createAsyncThunk(
  "agents/fetchAgent",
  async (agentId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/admin/agents/${agentId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch agent"
      );
    }
  }
);

export const createAgent = createAsyncThunk(
  "agents/createAgent",
  async (agentData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/agents", agentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create agent"
      );
    }
  }
);

export const updateAgent = createAsyncThunk(
  "agents/updateAgent",
  async ({ agentId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/agents/${agentId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update agent"
      );
    }
  }
);

export const deleteAgent = createAsyncThunk(
  "agents/deleteAgent",
  async (agentId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/agents/${agentId}`);
      return agentId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete agent"
      );
    }
  }
);

export const updateAgentStatus = createAsyncThunk(
  "agents/updateAgentStatus",
  async ({ agentId, status }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/agents/${agentId}/status`, {
        status,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update agent status"
      );
    }
  }
);

const initialState = {
  agents: [],
  currentAgent: null,
  loading: false,
  error: null,
};

const agentSlice = createSlice({
  name: "agents",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentAgent: (state, action) => {
      state.currentAgent = action.payload;
    },
    updateAgentInList: (state, action) => {
      const { agentId, updates } = action.payload;
      const index = state.agents.findIndex((agent) => agent._id === agentId);
      if (index !== -1) {
        state.agents[index] = { ...state.agents[index], ...updates };
      }
    },
    setAgentOnline: (state, action) => {
      const agentId = action.payload;
      const agent = state.agents.find((agent) => agent._id === agentId);
      if (agent) {
        agent.isOnline = true;
        agent.lastActiveAt = new Date().toISOString();
      }
    },
    setAgentOffline: (state, action) => {
      const agentId = action.payload;
      const agent = state.agents.find((agent) => agent._id === agentId);
      if (agent) {
        agent.isOnline = false;
      }
    },
    updateAgentWorkload: (state, action) => {
      const { agentId, currentTickets, maxTickets } = action.payload;
      const agent = state.agents.find((agent) => agent._id === agentId);
      if (agent) {
        agent.currentTickets = currentTickets;
        agent.maxTickets = maxTickets;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch agents
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = action.payload.agents || [];
        state.error = null;
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch agent
      .addCase(fetchAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAgent = action.payload;
        state.error = null;
      })
      .addCase(fetchAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create agent
      .addCase(createAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.agents.push(action.payload);
        state.error = null;
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update agent
      .addCase(updateAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.agents.findIndex(
          (agent) => agent._id === action.payload._id
        );
        if (index !== -1) {
          state.agents[index] = action.payload;
        }

        if (
          state.currentAgent &&
          state.currentAgent._id === action.payload._id
        ) {
          state.currentAgent = action.payload;
        }

        state.error = null;
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete agent
      .addCase(deleteAgent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.agents = state.agents.filter(
          (agent) => agent._id !== action.payload
        );
        if (state.currentAgent && state.currentAgent._id === action.payload) {
          state.currentAgent = null;
        }
        state.error = null;
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update agent status
      .addCase(updateAgentStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAgentStatus.fulfilled, (state, action) => {
        state.loading = false;
        const agent = state.agents.find(
          (agent) => agent._id === action.payload._id
        );
        if (agent) {
          agent.isOnline = action.payload.isOnline;
          agent.lastActiveAt = action.payload.lastActiveAt;
        }

        if (
          state.currentAgent &&
          state.currentAgent._id === action.payload._id
        ) {
          state.currentAgent.isOnline = action.payload.isOnline;
          state.currentAgent.lastActiveAt = action.payload.lastActiveAt;
        }

        state.error = null;
      })
      .addCase(updateAgentStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentAgent,
  updateAgentInList,
  setAgentOnline,
  setAgentOffline,
  updateAgentWorkload,
} = agentSlice.actions;

// Selectors
export const selectAgents = (state) => state.agents.agents;
export const selectCurrentAgent = (state) => state.agents.currentAgent;
export const selectAgentsLoading = (state) => state.agents.loading;
export const selectAgentsError = (state) => state.agents.error;
export const selectOnlineAgents = (state) =>
  state.agents.agents.filter((agent) => agent.isOnline);
export const selectAvailableAgents = (state) =>
  state.agents.agents.filter(
    (agent) =>
      agent.isOnline &&
      agent.isActive &&
      agent.currentTickets.length < agent.maxConcurrentTickets
  );

export default agentSlice.reducer;

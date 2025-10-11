import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import api from "../services/api";

// Async thunks
export const login = createAsyncThunk(
  "auth/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/login", {
        username,
        password,
      });

      const { token, agent } = response.data;

      // Store token in localStorage
      localStorage.setItem("authToken", token);

      return { token, agent };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Login failed");
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      // Remove token from localStorage
      localStorage.removeItem("authToken");
      return true;
    } catch (error) {
      return rejectWithValue("Logout failed");
    }
  }
);

export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        throw new Error("No token found");
      }

      const response = await api.get("/admin/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.data;
    } catch (error) {
      localStorage.removeItem("authToken");
      return rejectWithValue("Token verification failed");
    }
  }
);

const initialState = {
  isAuthenticated: false,
  token: null,
  agent: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      const { token, agent } = action.payload;
      state.token = token;
      state.agent = agent;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.agent = action.payload.agent;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.agent = null;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.agent = null;
        state.error = null;
      })

      // Verify token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.agent = action.payload.agent;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.agent = null;
      });
  },
});

export const { clearError, setCredentials } = authSlice.actions;

// Selectors
export const useAuth = () => {
  const state = useSelector((state) => state.auth);
  return {
    isAuthenticated: state.isAuthenticated,
    agent: state.agent,
    loading: state.loading,
    error: state.error,
  };
};

export default authSlice.reducer;

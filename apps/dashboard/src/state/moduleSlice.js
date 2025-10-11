import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api";

// Async thunks
export const fetchModules = createAsyncThunk(
  "modules/fetchModules",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/admin/modules");
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to fetch modules"
      );
    }
  }
);

export const selectModule = createAsyncThunk(
  "modules/selectModule",
  async (moduleId, { rejectWithValue }) => {
    try {
      // This would typically make an API call to set the selected module
      // For now, we'll just return the moduleId
      return moduleId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to select module"
      );
    }
  }
);

export const updateModule = createAsyncThunk(
  "modules/updateModule",
  async ({ moduleId, updates }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/modules/${moduleId}`, updates);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to update module"
      );
    }
  }
);

export const createModule = createAsyncThunk(
  "modules/createModule",
  async (moduleData, { rejectWithValue }) => {
    try {
      const response = await api.post("/admin/modules", moduleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to create module"
      );
    }
  }
);

export const deleteModule = createAsyncThunk(
  "modules/deleteModule",
  async (moduleId, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/modules/${moduleId}`);
      return moduleId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Failed to delete module"
      );
    }
  }
);

const initialState = {
  modules: [],
  selectedModule: null,
  loading: false,
  error: null,
};

const moduleSlice = createSlice({
  name: "modules",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedModule: (state, action) => {
      state.selectedModule = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch modules
      .addCase(fetchModules.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModules.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = action.payload;
        state.error = null;
      })
      .addCase(fetchModules.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Select module
      .addCase(selectModule.fulfilled, (state, action) => {
        state.selectedModule = action.payload;
      })

      // Update module
      .addCase(updateModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateModule.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.modules.findIndex(
          (module) => module.id === action.payload.id
        );
        if (index !== -1) {
          state.modules[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create module
      .addCase(createModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createModule.fulfilled, (state, action) => {
        state.loading = false;
        state.modules.push(action.payload);
        state.error = null;
      })
      .addCase(createModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete module
      .addCase(deleteModule.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteModule.fulfilled, (state, action) => {
        state.loading = false;
        state.modules = state.modules.filter(
          (module) => module.id !== action.payload
        );
        if (state.selectedModule === action.payload) {
          state.selectedModule = null;
        }
        state.error = null;
      })
      .addCase(deleteModule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setSelectedModule } = moduleSlice.actions;

// Selectors
export const selectModules = (state) => state.modules.modules;
export const selectSelectedModule = (state) => state.modules.selectedModule;
export const selectModulesLoading = (state) => state.modules.loading;
export const selectModulesError = (state) => state.modules.error;

export default moduleSlice.reducer;

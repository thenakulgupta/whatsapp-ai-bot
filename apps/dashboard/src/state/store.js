import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./authSlice";
import moduleSlice from "./moduleSlice";
import chatSlice from "./chatSlice";
import ticketSlice from "./ticketSlice";
import agentSlice from "./agentSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    modules: moduleSlice,
    chats: chatSlice,
    tickets: ticketSlice,
    agents: agentSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});

export default store;

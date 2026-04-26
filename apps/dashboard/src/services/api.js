import axios from "axios";
import toast from "react-hot-toast";
// Create axios instance
const api = axios.create({
  baseURL: "https://whatsapp-ai-bot-backend-projects.nakulgupta.in/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.error || error.message || "An error occurred";

    // Don't show toast for auth errors (handled by auth slice)
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  login: "/admin/login",
  verify: "/admin/verify",
  logout: "/admin/logout",

  // Modules
  modules: "/admin/modules",
  moduleStats: (id) => `/admin/modules/${id}/stats`,

  // Chats
  chats: "/chats",
  chatHistory: (userId) => `/chats/${userId}/history`,
  escalateChat: (chatId) => `/chats/${chatId}/escalate`,

  // Tickets
  tickets: "/tickets",
  ticket: (id) => `/tickets/${id}`,
  assignTicket: (id) => `/tickets/${id}/assign`,
  updateTicket: (id) => `/tickets/${id}`,
  ticketMessages: (id) => `/tickets/${id}/messages`,
  sendTicketMessage: (id) => `/tickets/${id}/messages`,

  // Agents
  agents: "/admin/agents",
  agent: (id) => `/admin/agents/${id}`,
  agentStats: (id) => `/admin/agents/${id}/stats`,

  // Analytics
  analytics: "/analytics",
  moduleAnalytics: (moduleId) => `/analytics/modules/${moduleId}`,
  chatAnalytics: "/analytics/chats",
  ticketAnalytics: "/analytics/tickets",
};

// Helper functions
export const handleApiError = (error) => {
  const message =
    error.response?.data?.error || error.message || "An error occurred";
  toast.error(message);
  return message;
};

export const handleApiSuccess = (message) => {
  toast.success(message);
};

export default api;

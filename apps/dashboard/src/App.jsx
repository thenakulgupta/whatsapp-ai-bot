import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useDispatch } from "react-redux";

import Layout from "./components/Layout";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Chats from "./components/Chats";
import Tickets from "./components/Tickets";
import Analytics from "./components/Analytics";
import Modules from "./components/Modules";
import Agents from "./components/Agents";
import { useAuth, verifyToken } from "./state/authSlice";

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Check if there's a token in localStorage and verify it
    const token = localStorage.getItem("authToken");
    if (token && !isAuthenticated) {
      dispatch(verifyToken());
    }
  }, [dispatch, isAuthenticated]);

  // Show loading spinner while verifying token
  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Box>
  );
}

export default App;

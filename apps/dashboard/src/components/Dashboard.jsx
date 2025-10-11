import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Chat as ChatIcon,
  SupportAgent as TicketIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api, { endpoints } from "../services/api";
import wsService from "../services/ws";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

function Dashboard() {
  const { selectedModule } = useSelector((state) => state.modules);
  const [stats, setStats] = useState({
    totalChats: 0,
    activeChats: 0,
    totalTickets: 0,
    openTickets: 0,
    totalAgents: 0,
    onlineAgents: 0,
    totalSessions: 0,
    activeSessions: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Setup WebSocket listeners for real-time updates
    wsService.on("new_chat", handleNewChat);
    wsService.on("chat_updated", handleChatUpdate);
    wsService.on("new_ticket", handleNewTicket);
    wsService.on("ticket_updated", handleTicketUpdate);
    wsService.on("analytics_updated", handleAnalyticsUpdate);

    return () => {
      wsService.off("new_chat", handleNewChat);
      wsService.off("chat_updated", handleChatUpdate);
      wsService.off("new_ticket", handleNewTicket);
      wsService.off("ticket_updated", handleTicketUpdate);
      wsService.off("analytics_updated", handleAnalyticsUpdate);
    };
  }, [selectedModule]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsResponse = await api.get(endpoints.analytics, {
        params: { moduleId: selectedModule },
      });
      setStats(statsResponse.data.stats || stats);

      // Fetch chart data
      const chartResponse = await api.get(endpoints.chatAnalytics, {
        params: {
          moduleId: selectedModule,
          period: "7d",
        },
      });
      setChartData(chartResponse.data.chartData || []);

      // Fetch recent chats
      const chatsResponse = await api.get(endpoints.chats, {
        params: {
          moduleId: selectedModule,
          limit: 5,
          sort: "recent",
        },
      });
      setRecentChats(chatsResponse.data.chats || []);

      // Fetch recent tickets
      const ticketsResponse = await api.get(endpoints.tickets, {
        params: {
          moduleId: selectedModule,
          limit: 5,
          sort: "recent",
        },
      });
      setRecentTickets(ticketsResponse.data.tickets || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = (data) => {
    setRecentChats((prev) => [data, ...prev.slice(0, 4)]);
    setStats((prev) => ({
      ...prev,
      totalChats: prev.totalChats + 1,
      activeChats: prev.activeChats + 1,
    }));
  };

  const handleChatUpdate = (data) => {
    setRecentChats((prev) =>
      prev.map((chat) =>
        chat.id === data.chatId ? { ...chat, ...data } : chat
      )
    );
  };

  const handleNewTicket = (data) => {
    setRecentTickets((prev) => [data, ...prev.slice(0, 4)]);
    setStats((prev) => ({
      ...prev,
      totalTickets: prev.totalTickets + 1,
      openTickets: prev.openTickets + 1,
    }));
  };

  const handleTicketUpdate = (data) => {
    setRecentTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === data.ticketId ? { ...ticket, ...data } : ticket
      )
    );
  };

  const handleAnalyticsUpdate = (data) => {
    setStats((prev) => ({ ...prev, ...data }));
  };

  const StatCard = ({ title, value, icon, color, subtitle, trend }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <TrendingUpIcon
                  sx={{
                    fontSize: 16,
                    color: trend > 0 ? "success.main" : "error.main",
                  }}
                />
                <Typography
                  variant="caption"
                  color={trend > 0 ? "success.main" : "error.main"}
                >
                  {trend > 0 ? "+" : ""}
                  {trend}% from last week
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "failed":
        return "error";
      case "escalated":
        return "info";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: "100%" }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: "center" }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton onClick={fetchDashboardData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Chats"
            value={stats.totalChats}
            icon={<ChatIcon />}
            color="primary.main"
            subtitle={`${stats.activeChats} active`}
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Open Tickets"
            value={stats.openTickets}
            icon={<TicketIcon />}
            color="warning.main"
            subtitle={`${stats.totalTickets} total`}
            trend={-5}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Online Agents"
            value={stats.onlineAgents}
            icon={<PeopleIcon />}
            color="success.main"
            subtitle={`${stats.totalAgents} total`}
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Sessions"
            value={stats.activeSessions}
            icon={<TrendingUpIcon />}
            color="info.main"
            subtitle={`${stats.totalSessions} total`}
            trend={15}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Chat Activity Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chat Activity (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="chats"
                    stroke="#1976d2"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="tickets"
                    stroke="#dc004e"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List dense>
                {recentChats.slice(0, 3).map((chat, index) => (
                  <ListItem key={chat.id} divider={index < 2}>
                    <ListItemIcon>
                      <ChatIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={chat.userPhone}
                      secondary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={chat.status}
                            size="small"
                            color={getStatusColor(chat.status)}
                          />
                          <Typography variant="caption">
                            {new Date(chat.createdAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tickets */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Tickets
              </Typography>
              <List dense>
                {recentTickets.slice(0, 5).map((ticket, index) => (
                  <ListItem key={ticket.id} divider={index < 4}>
                    <ListItemIcon>
                      {ticket.status === "resolved" ? (
                        <CheckCircleIcon color="success" />
                      ) : ticket.status === "in_progress" ? (
                        <ScheduleIcon color="warning" />
                      ) : (
                        <ErrorIcon color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={ticket.title}
                      secondary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Chip
                            label={ticket.priority}
                            size="small"
                            color={getPriorityColor(ticket.priority)}
                          />
                          <Chip
                            label={ticket.status}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Module Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Module Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Real Estate", value: 45 },
                      { name: "E-commerce", value: 30 },
                      { name: "Healthcare", value: 15 },
                      { name: "HR Support", value: 10 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;

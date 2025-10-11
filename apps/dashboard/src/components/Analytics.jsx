import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { selectSelectedModule } from "../state/moduleSlice";
import api from "../services/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

function Analytics() {
  const selectedModule = useSelector(selectSelectedModule);
  const [timeRange, setTimeRange] = useState("7d");
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    chatTrends: [],
    ticketTrends: [],
    moduleStats: [],
    agentPerformance: [],
    responseTimeData: [],
    escalationData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedModule, timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      const [overviewRes, chatRes, ticketRes, moduleRes, agentRes] =
        await Promise.all([
          api.get("/analytics/overview", {
            params: { moduleId: selectedModule, period: timeRange },
          }),
          api.get("/analytics/chats", {
            params: { moduleId: selectedModule, period: timeRange },
          }),
          api.get("/analytics/tickets", {
            params: { moduleId: selectedModule, period: timeRange },
          }),
          api.get("/analytics/modules", { params: { period: timeRange } }),
          api.get("/analytics/agents", {
            params: { moduleId: selectedModule, period: timeRange },
          }),
        ]);

      setAnalyticsData({
        overview: overviewRes.data,
        chatTrends: chatRes.data.trends || [],
        ticketTrends: ticketRes.data.trends || [],
        moduleStats: moduleRes.data.stats || [],
        agentPerformance: agentRes.data.performance || [],
        responseTimeData: chatRes.data.responseTime || [],
        escalationData: ticketRes.data.escalations || [],
      });
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, color = "primary" }) => (
    <Card>
      <CardContent>
        <Typography color="text.secondary" gutterBottom variant="h6">
          {title}
        </Typography>
        <Typography variant="h4" component="div" color={`${color}.main`}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

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
          Analytics
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="24h">Last 24 Hours</MenuItem>
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 90 Days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Overview Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Chats"
            value={analyticsData.overview.totalChats || 0}
            subtitle={`${analyticsData.overview.activeChats || 0} active`}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Tickets"
            value={analyticsData.overview.totalTickets || 0}
            subtitle={`${analyticsData.overview.openTickets || 0} open`}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Response Time"
            value={`${analyticsData.overview.avgResponseTime || 0}ms`}
            subtitle="Last 24 hours"
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Escalation Rate"
            value={`${analyticsData.overview.escalationRate || 0}%`}
            subtitle="Chats escalated"
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Chat Trends */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Chat Activity Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.chatTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="chats"
                    stackId="1"
                    stroke="#1976d2"
                    fill="#1976d2"
                  />
                  <Area
                    type="monotone"
                    dataKey="escalated"
                    stackId="1"
                    stroke="#dc004e"
                    fill="#dc004e"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Module Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Module Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analyticsData.moduleStats}
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
                    {analyticsData.moduleStats.map((entry, index) => (
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

        {/* Response Time Trends */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time Trends
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analyticsData.responseTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#00C49F"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="maxResponseTime"
                    stroke="#FF8042"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Ticket Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ticket Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analyticsData.ticketTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="open" stackId="a" fill="#FFBB28" />
                  <Bar dataKey="resolved" stackId="a" fill="#00C49F" />
                  <Bar dataKey="closed" stackId="a" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Agent Performance */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Performance
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Agent</TableCell>
                      <TableCell align="right">Tickets Handled</TableCell>
                      <TableCell align="right">Avg Response Time</TableCell>
                      <TableCell align="right">Resolution Rate</TableCell>
                      <TableCell align="right">Satisfaction</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.agentPerformance.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle2">
                              {agent.name}
                            </Typography>
                            <Chip
                              label={agent.role}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          {agent.ticketsHandled}
                        </TableCell>
                        <TableCell align="right">
                          {agent.avgResponseTime}ms
                        </TableCell>
                        <TableCell align="right">
                          {agent.resolutionRate}%
                        </TableCell>
                        <TableCell align="right">
                          {agent.satisfaction}/5
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={agent.isOnline ? "Online" : "Offline"}
                            color={agent.isOnline ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Analytics;

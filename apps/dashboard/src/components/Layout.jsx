import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Dashboard as DashboardIcon,
  Chat as ChatIcon,
  SupportAgent as TicketIcon,
  Analytics as AnalyticsIcon,
  Extension as ModuleIcon,
  People as AgentIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { fetchModules, selectModule } from "../state/moduleSlice";
import { logout } from "../state/authSlice";
import wsService from "../services/ws";

const drawerWidth = 240;

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Chats", icon: <ChatIcon />, path: "/chats" },
  { text: "Tickets", icon: <TicketIcon />, path: "/tickets" },
  { text: "Analytics", icon: <AnalyticsIcon />, path: "/analytics" },
  { text: "Modules", icon: <ModuleIcon />, path: "/modules" },
  { text: "Agents", icon: <AgentIcon />, path: "/agents" },
];

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { agent } = useSelector((state) => state.auth);
  const { modules, selectedModule, loading } = useSelector(
    (state) => state.modules
  );

  useEffect(() => {
    // Fetch modules on component mount
    dispatch(fetchModules());

    // Connect to WebSocket
    if (agent) {
      wsService.connect();
      wsService.authenticateAgent(agent._id, agent.role, agent.assignedModules);
    }

    // Setup WebSocket listeners
    const handleNewTicketNotification = (data) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "ticket",
          message: `New ticket: ${data.ticketId}`,
          timestamp: new Date(),
        },
      ]);
    };

    const handleChatEscalatedNotification = (data) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "chat",
          message: `Chat escalated: ${data.chatId}`,
          timestamp: new Date(),
        },
      ]);
    };

    wsService.on("new_ticket", handleNewTicketNotification);
    wsService.on("chat_escalated", handleChatEscalatedNotification);

    return () => {
      wsService.off("new_ticket", handleNewTicketNotification);
      wsService.off("chat_escalated", handleChatEscalatedNotification);
      // Don't disconnect - other components need the WebSocket
    };
  }, [dispatch, agent]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
    handleProfileMenuClose();
  };

  const handleModuleChange = (event) => {
    const moduleId = event.target.value;
    dispatch(selectModule(moduleId));
    wsService.selectModule(moduleId);
  };

  const handleNotificationClick = (notification) => {
    // Remove notification
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));

    // Navigate based on notification type
    if (notification.type === "ticket") {
      navigate("/tickets");
    } else if (notification.type === "chat") {
      navigate("/chats");
    }
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Universal AI
        </Typography>
      </Toolbar>
      <Divider />

      {/* Module Filter */}
      <Box sx={{ p: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Module</InputLabel>
          <Select
            value={selectedModule || ""}
            label="Module"
            onChange={handleModuleChange}
            disabled={loading}
          >
            <MenuItem value="">
              <em>All Modules</em>
            </MenuItem>
            {modules.map((module) => (
              <MenuItem key={module.id} value={module.id}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <span>{module.icon}</span>
                  <span>{module.name}</span>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Divider />

      <List>
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => navigate(item.path)}
            selected={location.pathname === item.path}
            sx={{
              mx: 1,
              borderRadius: 1,
              "&.Mui-selected": {
                backgroundColor: "primary.main",
                color: "white",
                "&:hover": {
                  backgroundColor: "primary.dark",
                },
                "& .MuiSvgIcon-root": {
                  color: "white",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                width: "100%",
              }}
            >
              {item.icon}
              <Typography variant="body2">{item.text}</Typography>
            </Box>
          </MenuItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {selectedModule
              ? modules.find((m) => m.id === selectedModule)?.name ||
                "Dashboard"
              : "Dashboard"}
          </Typography>

          {/* Connection Status */}
          <Chip
            label={
              wsService.getConnectionStatus().isConnected
                ? "Connected"
                : "Disconnected"
            }
            color={
              wsService.getConnectionStatus().isConnected ? "success" : "error"
            }
            size="small"
            sx={{ mr: 2 }}
          />

          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Profile Menu */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account of current user"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              {agent?.name?.charAt(0) || "A"}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="subtitle2">{agent?.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {agent?.role}
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout;

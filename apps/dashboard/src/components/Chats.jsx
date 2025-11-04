import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Badge,
  Divider,
} from "@mui/material";
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  SupportAgent as EscalateIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { fetchChats, escalateChat, setCurrentChat } from "../state/chatSlice";
import { selectSelectedModule } from "../state/moduleSlice";
import wsService from "../services/ws";
import { formatDistanceToNow } from "date-fns";

function Chats() {
  const dispatch = useDispatch();
  const selectedModule = useSelector(selectSelectedModule);
  const { chats, loading, error } = useSelector((state) => state.chats);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [escalateDialog, setEscalateDialog] = useState({
    open: false,
    chat: null,
  });
  const [escalateReason, setEscalateReason] = useState("");
  const [escalatePriority, setEscalatePriority] = useState("medium");

  useEffect(() => {
    fetchChatsData();

    // Setup WebSocket listeners
    wsService.on("new_chat", handleNewChat);
    wsService.on("chat_updated", handleChatUpdate);
    wsService.on("chat_escalated", handleChatEscalated);

    return () => {
      wsService.off("new_chat", handleNewChat);
      wsService.off("chat_updated", handleChatUpdate);
      wsService.off("chat_escalated", handleChatEscalated);
    };
  }, [selectedModule]);

  const fetchChatsData = () => {
    dispatch(
      fetchChats({
        moduleId: selectedModule,
        status: statusFilter || null,
      })
    );
  };

  const handleNewChat = (data) => {
    // Chat will be added to the list via Redux
  };

  const handleChatUpdate = (data) => {
    // Chat will be updated via Redux
  };

  const handleChatEscalated = (data) => {
    // Chat escalation will be handled via Redux
  };

  const handleEscalateClick = (chat) => {
    setEscalateDialog({ open: true, chat });
    setEscalateReason("");
    setEscalatePriority("medium");
  };

  const handleEscalateSubmit = () => {
    if (escalateDialog.chat && escalateReason) {
      const chatId = escalateDialog.chat._id || escalateDialog.chat.id;
      if (!chatId) {
        console.error("Chat ID is missing", escalateDialog.chat);
        return;
      }
      dispatch(
        escalateChat({
          chatId,
          reason: escalateReason,
          priority: escalatePriority,
        })
      );
      setEscalateDialog({ open: false, chat: null });
    }
  };

  const handleChatClick = (chat) => {
    dispatch(setCurrentChat(chat));
  };

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon />;
      case "processing":
        return <ScheduleIcon />;
      case "failed":
        return <ErrorIcon />;
      case "escalated":
        return <EscalateIcon />;
      default:
        return <ChatIcon />;
    }
  };

  const filteredChats = chats.filter((chat) => {
    const matchesSearch =
      chat.userPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chat.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || chat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          Chats
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchChatsData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <TextField
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ flexGrow: 1 }}
            />
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="escalated">Escalated</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Chats List */}
      <Card>
        <CardContent>
          {loading ? (
            <Typography>Loading chats...</Typography>
          ) : filteredChats.length === 0 ? (
            <Typography
              color="text.secondary"
              textAlign="center"
              sx={{ py: 4 }}
            >
              No chats found
            </Typography>
          ) : (
            <List>
              {filteredChats.map((chat, index) => (
                <React.Fragment key={chat._id || chat.id || index}>
                  <ListItem
                    button
                    onClick={() => handleChatClick(chat)}
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        badgeContent={
                          <Chip
                            icon={getStatusIcon(chat.status)}
                            label={chat.status}
                            size="small"
                            color={getStatusColor(chat.status)}
                            sx={{ height: 20, fontSize: "0.75rem" }}
                          />
                        }
                      >
                        <Avatar>
                          <PersonIcon />
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="subtitle1">
                            {chat.userPhone}
                          </Typography>
                          <Chip
                            label={chat.moduleId}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {chat.message}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDistanceToNow(new Date(chat.createdAt), {
                                addSuffix: true,
                              })}
                            </Typography>
                            {chat.responseTime && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                • {chat.responseTime}ms
                              </Typography>
                            )}
                            {chat.isEscalated && (
                              <Chip
                                label="Escalated"
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                      }
                    />
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: 1,
                      }}
                    >
                      {!chat.isEscalated && (
                        <Tooltip title="Escalate Chat">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEscalateClick(chat);
                            }}
                          >
                            <EscalateIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItem>
                  {index < filteredChats.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Escalate Dialog */}
      <Dialog
        open={escalateDialog.open}
        onClose={() => setEscalateDialog({ open: false, chat: null })}
      >
        <DialogTitle>Escalate Chat</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Reason for escalation"
              multiline
              rows={3}
              value={escalateReason}
              onChange={(e) => setEscalateReason(e.target.value)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={escalatePriority}
                label="Priority"
                onChange={(e) => setEscalatePriority(e.target.value)}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setEscalateDialog({ open: false, chat: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEscalateSubmit}
            variant="contained"
            disabled={!escalateReason}
          >
            Escalate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Chats;

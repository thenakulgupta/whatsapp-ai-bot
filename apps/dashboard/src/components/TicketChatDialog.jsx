import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  IconButton,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  SupportAgent as AgentIcon,
  CheckCircle as CheckCircleIcon,
  Done as DoneIcon,
  DoneAll as DoneAllIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import api, { endpoints } from "../services/api";
import wsService from "../services/ws";
import toast from "react-hot-toast";

function TicketChatDialog({ open, onClose, ticket }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if ticket is assigned
  const isAssigned = ticket?.assignedTo != null;
  const canSendMessage = isAssigned;

  const handleNewMessage = useCallback(
    (data) => {
      // Only add message if it belongs to this ticket
      const ticketId = ticket?._id || ticket?.id;
      if (data.ticketId === ticketId && data.message) {
        // Check if message already exists (prevent duplicates)
        setMessages((prev) => {
          const messageId = data.message._id || data.message.id;
          const exists = prev.some((msg) => {
            const existingId = msg._id || msg.id;
            return existingId === messageId;
          });

          // Only add if it doesn't exist
          if (!exists) {
            return [...prev, data.message];
          }
          return prev;
        });
      }
    },
    [ticket]
  );

  useEffect(() => {
    if (open && ticket) {
      fetchMessages();

      // Setup WebSocket listener for new messages
      wsService.on("new_message", handleNewMessage);

      return () => {
        wsService.off("new_message", handleNewMessage);
      };
    }
  }, [open, ticket, handleNewMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    if (!ticket) return;

    setLoading(true);
    try {
      const ticketId = ticket._id || ticket.id;
      const response = await api.get(endpoints.ticketMessages(ticketId));
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      toast.error("Failed to load chat history");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending || !canSendMessage) return;

    setSending(true);
    try {
      const ticketId = ticket._id || ticket.id;
      await api.post(endpoints.sendTicketMessage(ticketId), {
        message: newMessage.trim(),
      });

      // Don't add message here - let WebSocket handle it to avoid duplicates
      // The backend will emit a WebSocket event and handleNewMessage will add it

      setNewMessage("");
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!ticket) return;

    setAssigning(true);
    try {
      const ticketId = ticket._id || ticket.id;
      // Get current user/agent ID from localStorage or auth state
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        toast.error("Not authenticated");
        setAssigning(false);
        return;
      }

      // You'll need to get the agent ID - assuming it's stored or from verify endpoint
      const verifyResponse = await api.get(endpoints.verify);
      const agentId =
        verifyResponse.data.agent?._id || verifyResponse.data.agent?.id;

      if (!agentId) {
        toast.error("Could not get agent ID");
        setAssigning(false);
        return;
      }

      await api.post(endpoints.assignTicket(ticketId), {
        agentId: agentId,
      });

      toast.success("Ticket assigned to you! Refreshing...");

      // Close dialog first
      onClose();

      // Then reload to refresh ticket data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      toast.error(error.response?.data?.error || "Failed to assign ticket");
    } finally {
      setAssigning(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCloseTicket = async () => {
    if (!ticket) return;

    setClosingTicket(true);
    try {
      const ticketId = ticket._id || ticket.id;
      await api.post(endpoints.ticket(ticketId) + "/close");

      toast.success("Ticket closed - AI responses will resume");
      onClose(); // Close the dialog
    } catch (error) {
      console.error("Failed to close ticket:", error);
      toast.error("Failed to close ticket");
    } finally {
      setClosingTicket(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getSenderIcon = (senderType) => {
    switch (senderType) {
      case "user":
        return <PersonIcon />;
      case "ai":
        return <BotIcon />;
      case "human":
        return <AgentIcon />;
      default:
        return <PersonIcon />;
    }
  };

  const getSenderColor = (senderType) => {
    switch (senderType) {
      case "user":
        return "primary.main";
      case "ai":
        return "info.main";
      case "human":
        return "success.main";
      default:
        return "grey.500";
    }
  };

  const getSenderLabel = (senderType) => {
    switch (senderType) {
      case "user":
        return "User";
      case "ai":
        return "AI Assistant";
      case "human":
        return "Agent";
      default:
        return "Unknown";
    }
  };

  if (!ticket) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: "80vh", display: "flex", flexDirection: "column" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          pb: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Avatar sx={{ bgcolor: "primary.main", width: 32, height: 32 }}>
              <PersonIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                {ticket.userPhone}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {ticket.title}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleCloseTicket}
            disabled={closingTicket || ticket.status === "closed"}
          >
            {closingTicket ? "Closing..." : "Close Ticket"}
          </Button>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          backgroundColor: "grey.50",
        }}
      >
        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {messages.map((message, index) => {
              const isUser = message.senderType === "user";
              const isAgent = message.senderType === "human";

              return (
                <Box
                  key={message._id || index}
                  sx={{
                    display: "flex",
                    flexDirection: isAgent ? "row-reverse" : "row",
                    gap: 1,
                    alignItems: "flex-start",
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: getSenderColor(message.senderType),
                      width: 36,
                      height: 36,
                    }}
                  >
                    {getSenderIcon(message.senderType)}
                  </Avatar>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: "70%",
                      backgroundColor: isAgent
                        ? "primary.light"
                        : "background.paper",
                      borderRadius: 2,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontWeight: "bold", mb: 0.5, display: "block" }}
                    >
                      {getSenderLabel(message.senderType)}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        color: isAgent
                          ? "primary.contrastText"
                          : "text.primary",
                      }}
                    >
                      {message.message}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color={
                          isAgent ? "primary.contrastText" : "text.secondary"
                        }
                        sx={{ opacity: 0.7 }}
                      >
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </Typography>
                      {isAgent && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {message.status === "completed" ? (
                            <DoneAllIcon
                              sx={{
                                fontSize: 14,
                                color: "primary.contrastText",
                                opacity: 0.7,
                              }}
                              titleAccess="Sent"
                            />
                          ) : message.status === "failed" ? (
                            <ErrorIcon
                              sx={{
                                fontSize: 14,
                                color: "error.light",
                              }}
                              titleAccess="Failed to send"
                            />
                          ) : (
                            <DoneIcon
                              sx={{
                                fontSize: 14,
                                color: "primary.contrastText",
                                opacity: 0.7,
                              }}
                              titleAccess="Sending..."
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Box>
              );
            })}
            <div ref={messagesEndRef} />
          </Box>
        )}
      </DialogContent>

      <Divider />

      {!isAssigned && (
        <Box
          sx={{
            p: 2,
            backgroundColor: "warning.light",
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" sx={{ mb: 1 }}>
            ⚠️ You must assign this ticket to yourself before you can send
            messages.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleAssignToMe}
            disabled={assigning}
          >
            {assigning ? "Assigning..." : "Assign to Me"}
          </Button>
        </Box>
      )}

      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          alignItems: "flex-end",
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder={
            isAssigned
              ? "Type your message..."
              : "Assign ticket to yourself to send messages"
          }
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={sending || !canSendMessage}
          variant="outlined"
          size="small"
        />
        <Button
          variant="contained"
          endIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          onClick={handleSendMessage}
          disabled={!newMessage.trim() || sending || !canSendMessage}
          sx={{ minWidth: 100 }}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TicketChatDialog;

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
  Divider,
  LinearProgress,
} from "@mui/material";
import {
  SupportAgent as TicketIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  fetchTickets,
  assignTicket,
  updateTicket,
  resolveTicket,
  closeTicket,
} from "../state/ticketSlice";
import { selectSelectedModule } from "../state/moduleSlice";
import wsService from "../services/ws";
import { formatDistanceToNow } from "date-fns";

function Tickets() {
  const dispatch = useDispatch();
  const selectedModule = useSelector(selectSelectedModule);
  const { tickets, loading, error } = useSelector((state) => state.tickets);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    ticket: null,
  });
  const [resolveDialog, setResolveDialog] = useState({
    open: false,
    ticket: null,
  });
  const [resolution, setResolution] = useState("");

  useEffect(() => {
    fetchTicketsData();

    // Setup WebSocket listeners
    wsService.on("new_ticket", handleNewTicket);
    wsService.on("ticket_updated", handleTicketUpdate);
    wsService.on("ticket_assigned", handleTicketAssigned);

    return () => {
      wsService.off("new_ticket", handleNewTicket);
      wsService.off("ticket_updated", handleTicketUpdate);
      wsService.off("ticket_assigned", handleTicketAssigned);
    };
  }, [selectedModule]);

  const fetchTicketsData = () => {
    dispatch(
      fetchTickets({
        moduleId: selectedModule,
        status: statusFilter || null,
      })
    );
  };

  const handleNewTicket = (data) => {
    // Ticket will be added to the list via Redux
  };

  const handleTicketUpdate = (data) => {
    // Ticket will be updated via Redux
  };

  const handleTicketAssigned = (data) => {
    // Ticket assignment will be handled via Redux
  };

  const handleAssignClick = (ticket) => {
    setAssignDialog({ open: true, ticket });
  };

  const handleAssignSubmit = (agentId) => {
    if (assignDialog.ticket) {
      dispatch(
        assignTicket({
          ticketId: assignDialog.ticket.id,
          agentId,
        })
      );
      setAssignDialog({ open: false, ticket: null });
    }
  };

  const handleResolveClick = (ticket) => {
    setResolveDialog({ open: true, ticket });
    setResolution("");
  };

  const handleResolveSubmit = () => {
    if (resolveDialog.ticket && resolution) {
      dispatch(
        resolveTicket({
          ticketId: resolveDialog.ticket.id,
          resolution,
        })
      );
      setResolveDialog({ open: false, ticket: null });
    }
  };

  const handleCloseTicket = (ticketId) => {
    dispatch(closeTicket(ticketId));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "default";
      case "assigned":
        return "info";
      case "in_progress":
        return "warning";
      case "resolved":
        return "success";
      case "closed":
        return "default";
      case "cancelled":
        return "error";
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

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <TicketIcon />;
      case "assigned":
        return <AssignmentIcon />;
      case "in_progress":
        return <ScheduleIcon />;
      case "resolved":
        return <CheckCircleIcon />;
      case "closed":
        return <CheckCircleIcon />;
      case "cancelled":
        return <ErrorIcon />;
      default:
        return <TicketIcon />;
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.userPhone.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    const matchesPriority =
      !priorityFilter || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
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
          Tickets
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchTicketsData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardContent>
          {loading ? (
            <Box>
              <LinearProgress />
              <Typography sx={{ mt: 2 }}>Loading tickets...</Typography>
            </Box>
          ) : filteredTickets.length === 0 ? (
            <Typography
              color="text.secondary"
              textAlign="center"
              sx={{ py: 4 }}
            >
              No tickets found
            </Typography>
          ) : (
            <List>
              {filteredTickets.map((ticket, index) => (
                <React.Fragment key={ticket.id}>
                  <ListItem
                    sx={{
                      borderRadius: 1,
                      mb: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getStatusColor(ticket.status) + ".main",
                        }}
                      >
                        {getStatusIcon(ticket.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                            {ticket.title}
                          </Typography>
                          <Chip
                            label={ticket.priority}
                            size="small"
                            color={getPriorityColor(ticket.priority)}
                          />
                          <Chip
                            label={ticket.status}
                            size="small"
                            color={getStatusColor(ticket.status)}
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
                              mb: 1,
                            }}
                          >
                            {ticket.description}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              flexWrap: "wrap",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <PersonIcon
                                sx={{
                                  fontSize: 14,
                                  mr: 0.5,
                                  verticalAlign: "middle",
                                }}
                              />
                              {ticket.userPhone}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              <ScheduleIcon
                                sx={{
                                  fontSize: 14,
                                  mr: 0.5,
                                  verticalAlign: "middle",
                                }}
                              />
                              {formatDistanceToNow(new Date(ticket.createdAt), {
                                addSuffix: true,
                              })}
                            </Typography>
                            {ticket.assignedTo && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Assigned to: {ticket.assignedTo.name}
                              </Typography>
                            )}
                            {ticket.category && (
                              <Chip
                                label={ticket.category}
                                size="small"
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
                      {ticket.status === "open" && (
                        <Tooltip title="Assign Ticket">
                          <IconButton
                            size="small"
                            onClick={() => handleAssignClick(ticket)}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {ticket.status === "assigned" && (
                        <Tooltip title="Resolve Ticket">
                          <IconButton
                            size="small"
                            onClick={() => handleResolveClick(ticket)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {ticket.status === "resolved" && (
                        <Tooltip title="Close Ticket">
                          <IconButton
                            size="small"
                            onClick={() => handleCloseTicket(ticket.id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </ListItem>
                  {index < filteredTickets.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <Dialog
        open={assignDialog.open}
        onClose={() => setAssignDialog({ open: false, ticket: null })}
      >
        <DialogTitle>Assign Ticket</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Assign ticket "{assignDialog.ticket?.title}" to an agent
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Select Agent</InputLabel>
            <Select
              label="Select Agent"
              onChange={(e) => handleAssignSubmit(e.target.value)}
            >
              {/* This would be populated with available agents */}
              <MenuItem value="agent1">Agent 1</MenuItem>
              <MenuItem value="agent2">Agent 2</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignDialog({ open: false, ticket: null })}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Dialog */}
      <Dialog
        open={resolveDialog.open}
        onClose={() => setResolveDialog({ open: false, ticket: null })}
      >
        <DialogTitle>Resolve Ticket</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Provide resolution for ticket "{resolveDialog.ticket?.title}"
          </Typography>
          <TextField
            fullWidth
            label="Resolution"
            multiline
            rows={4}
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            placeholder="Describe how the issue was resolved..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setResolveDialog({ open: false, ticket: null })}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolveSubmit}
            variant="contained"
            disabled={!resolution}
          >
            Resolve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Tickets;

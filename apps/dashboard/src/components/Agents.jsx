import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon,
  OnlinePrediction as OnlineIcon,
  OfflineBolt as OfflineIcon,
  Work as WorkIcon,
} from "@mui/icons-material";
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deleteAgent,
  updateAgentStatus,
} from "../state/agentSlice";
import { selectSelectedModule } from "../state/moduleSlice";

function Agents() {
  const dispatch = useDispatch();
  const selectedModule = useSelector(selectSelectedModule);
  const { agents, loading, error } = useSelector((state) => state.agents);

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, agent: null });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    agent: null,
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "agent",
    assignedModules: [],
    maxConcurrentTickets: 5,
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchAgents());
  }, [dispatch]);

  const handleCreateClick = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "agent",
      assignedModules: [],
      maxConcurrentTickets: 5,
      isActive: true,
    });
    setCreateDialog(true);
  };

  const handleEditClick = (agent) => {
    setFormData({
      name: agent.name,
      email: agent.email,
      password: "",
      phone: agent.phone || "",
      role: agent.role,
      assignedModules: agent.assignedModules || [],
      maxConcurrentTickets: agent.maxConcurrentTickets || 5,
      isActive: agent.isActive,
    });
    setEditDialog({ open: true, agent });
  };

  const handleDeleteClick = (agent) => {
    setDeleteDialog({ open: true, agent });
  };

  const handleToggleStatus = (agent) => {
    dispatch(
      updateAgentStatus({
        agentId: agent._id,
        status: agent.isOnline ? "offline" : "online",
      })
    );
  };

  const handleCreateSubmit = () => {
    dispatch(createAgent(formData));
    setCreateDialog(false);
  };

  const handleEditSubmit = () => {
    const updates = { ...formData };
    if (!updates.password) {
      delete updates.password; // Don't update password if empty
    }

    dispatch(
      updateAgent({
        agentId: editDialog.agent._id,
        updates,
      })
    );
    setEditDialog({ open: false, agent: null });
  };

  const handleDeleteSubmit = () => {
    dispatch(deleteAgent(deleteDialog.agent._id));
    setDeleteDialog({ open: false, agent: null });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const AgentCard = ({ agent }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{ bgcolor: agent.isOnline ? "success.main" : "grey.500" }}
            >
              {agent.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" component="h3">
                {agent.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {agent.email}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title={agent.isOnline ? "Set Offline" : "Set Online"}>
              <IconButton
                size="small"
                onClick={() => handleToggleStatus(agent)}
                color={agent.isOnline ? "success" : "default"}
              >
                {agent.isOnline ? <OnlineIcon /> : <OfflineIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEditClick(agent)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(agent)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Chip
            label={agent.role}
            size="small"
            color={
              agent.role === "admin"
                ? "error"
                : agent.role === "supervisor"
                ? "warning"
                : "primary"
            }
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              label={agent.isOnline ? "Online" : "Offline"}
              size="small"
              color={agent.isOnline ? "success" : "default"}
            />
            <Chip
              label={agent.isActive ? "Active" : "Inactive"}
              size="small"
              color={agent.isActive ? "success" : "default"}
              variant="outlined"
            />
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Assigned Modules ({agent.assignedModules?.length || 0})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {agent.assignedModules?.slice(0, 2).map((module, index) => (
              <Chip
                key={index}
                label={module}
                size="small"
                variant="outlined"
              />
            ))}
            {agent.assignedModules?.length > 2 && (
              <Chip
                label={`+${agent.assignedModules.length - 2} more`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <WorkIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {agent.currentTickets?.length || 0}/
              {agent.maxConcurrentTickets || 5} tickets
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {agent.stats?.totalTicketsHandled || 0} total
          </Typography>
        </Box>
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
          Agents
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => dispatch(fetchAgents())}
              disabled={loading}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Add Agent
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading agents...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {agents.map((agent) => (
            <Grid item xs={12} sm={6} md={4} key={agent._id}>
              <AgentCard agent={agent} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Agent Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Agent</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => handleFormChange("role", e.target.value)}
                  >
                    <MenuItem value="agent">Agent</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Concurrent Tickets"
                  type="number"
                  value={formData.maxConcurrentTickets}
                  onChange={(e) =>
                    handleFormChange(
                      "maxConcurrentTickets",
                      parseInt(e.target.value)
                    )
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Modules</InputLabel>
                  <Select
                    multiple
                    value={formData.assignedModules}
                    label="Assigned Modules"
                    onChange={(e) =>
                      handleFormChange("assignedModules", e.target.value)
                    }
                  >
                    <MenuItem value="real_estate">Real Estate</MenuItem>
                    <MenuItem value="ecommerce">E-commerce</MenuItem>
                    <MenuItem value="healthcare">Healthcare</MenuItem>
                    <MenuItem value="hr_support">HR Support</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) =>
                        handleFormChange("isActive", e.target.checked)
                      }
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateSubmit} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Agent Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, agent: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Agent</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleFormChange("password", e.target.value)}
                  placeholder="Leave empty to keep current password"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange("phone", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => handleFormChange("role", e.target.value)}
                  >
                    <MenuItem value="agent">Agent</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Concurrent Tickets"
                  type="number"
                  value={formData.maxConcurrentTickets}
                  onChange={(e) =>
                    handleFormChange(
                      "maxConcurrentTickets",
                      parseInt(e.target.value)
                    )
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assigned Modules</InputLabel>
                  <Select
                    multiple
                    value={formData.assignedModules}
                    label="Assigned Modules"
                    onChange={(e) =>
                      handleFormChange("assignedModules", e.target.value)
                    }
                  >
                    <MenuItem value="real_estate">Real Estate</MenuItem>
                    <MenuItem value="ecommerce">E-commerce</MenuItem>
                    <MenuItem value="healthcare">Healthcare</MenuItem>
                    <MenuItem value="hr_support">HR Support</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) =>
                        handleFormChange("isActive", e.target.checked)
                      }
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, agent: null })}>
            Cancel
          </Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, agent: null })}
      >
        <DialogTitle>Delete Agent</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the agent "
            {deleteDialog.agent?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, agent: null })}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSubmit}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Agents;

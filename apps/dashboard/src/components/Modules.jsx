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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Extension as ModuleIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayIcon,
  Stop as StopIcon,
} from "@mui/icons-material";
import {
  fetchModules,
  updateModule,
  createModule,
  deleteModule,
} from "../state/moduleSlice";
import { selectSelectedModule } from "../state/moduleSlice";

function Modules() {
  const dispatch = useDispatch();
  const selectedModule = useSelector(selectSelectedModule);
  const { modules, loading, error } = useSelector((state) => state.modules);

  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, module: null });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    module: null,
  });
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    icon: "🏢",
    welcomeMessage: "",
    exitMessage: "",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchModules());
  }, [dispatch]);

  const handleCreateClick = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
      icon: "🏢",
      welcomeMessage: "",
      exitMessage: "",
      isActive: true,
    });
    setCreateDialog(true);
  };

  const handleEditClick = (module) => {
    setFormData({
      id: module.id,
      name: module.name,
      description: module.description,
      icon: module.icon,
      welcomeMessage: module.welcomeMessage,
      exitMessage: module.exitMessage,
      isActive: module.isActive,
    });
    setEditDialog({ open: true, module });
  };

  const handleDeleteClick = (module) => {
    setDeleteDialog({ open: true, module });
  };

  const handleToggleActive = (module) => {
    dispatch(
      updateModule({
        moduleId: module.id,
        updates: { isActive: !module.isActive },
      })
    );
  };

  const handleCreateSubmit = () => {
    dispatch(createModule(formData));
    setCreateDialog(false);
  };

  const handleEditSubmit = () => {
    dispatch(
      updateModule({
        moduleId: editDialog.module.id,
        updates: formData,
      })
    );
    setEditDialog({ open: false, module: null });
  };

  const handleDeleteSubmit = () => {
    dispatch(deleteModule(deleteDialog.module.id));
    setDeleteDialog({ open: false, module: null });
  };

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const ModuleCard = ({ module }) => (
    <Card sx={{ height: "100%", position: "relative" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h4">{module.icon}</Typography>
            <Box>
              <Typography variant="h6" component="h3">
                {module.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ID: {module.id}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title={module.isActive ? "Deactivate" : "Activate"}>
              <IconButton
                size="small"
                onClick={() => handleToggleActive(module)}
                color={module.isActive ? "success" : "default"}
              >
                {module.isActive ? <StopIcon /> : <PlayIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => handleEditClick(module)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(module)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {module.description}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Functions ({module.functions?.length || 0})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {module.functions?.slice(0, 3).map((func, index) => (
              <Chip
                key={index}
                label={func.name}
                size="small"
                variant="outlined"
              />
            ))}
            {module.functions?.length > 3 && (
              <Chip
                label={`+${module.functions.length - 3} more`}
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
          <Chip
            label={module.isActive ? "Active" : "Inactive"}
            color={module.isActive ? "success" : "default"}
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            {module.stats?.totalSessions || 0} sessions
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
          Modules
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => dispatch(fetchModules())}
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
            Add Module
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box>
          <LinearProgress />
          <Typography sx={{ mt: 2 }}>Loading modules...</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {modules.map((module) => (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <ModuleCard module={module} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Module Dialog */}
      <Dialog
        open={createDialog}
        onClose={() => setCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Module</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Module ID"
                  value={formData.id}
                  onChange={(e) => handleFormChange("id", e.target.value)}
                  placeholder="e.g., healthcare"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Module Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                  placeholder="e.g., Healthcare"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Icon"
                  value={formData.icon}
                  onChange={(e) => handleFormChange("icon", e.target.value)}
                  placeholder="🏥"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Welcome Message"
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    handleFormChange("welcomeMessage", e.target.value)
                  }
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exit Message"
                  value={formData.exitMessage}
                  onChange={(e) =>
                    handleFormChange("exitMessage", e.target.value)
                  }
                  multiline
                  rows={2}
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

      {/* Edit Module Dialog */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, module: null })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Module</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Module ID"
                  value={formData.id}
                  onChange={(e) => handleFormChange("id", e.target.value)}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Module Name"
                  value={formData.name}
                  onChange={(e) => handleFormChange("name", e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Icon"
                  value={formData.icon}
                  onChange={(e) => handleFormChange("icon", e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Welcome Message"
                  value={formData.welcomeMessage}
                  onChange={(e) =>
                    handleFormChange("welcomeMessage", e.target.value)
                  }
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exit Message"
                  value={formData.exitMessage}
                  onChange={(e) =>
                    handleFormChange("exitMessage", e.target.value)
                  }
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, module: null })}>
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
        onClose={() => setDeleteDialog({ open: false, module: null })}
      >
        <DialogTitle>Delete Module</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the module "
            {deleteDialog.module?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, module: null })}
          >
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

export default Modules;

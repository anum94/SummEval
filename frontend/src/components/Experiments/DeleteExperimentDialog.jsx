import * as React from "react";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import axios, { endpoints } from '../../utils/axios.js';
import { useNavigate } from "react-router-dom";
import {ProjectsContext} from '../../ProjectsProvider.jsx';
import {useContext} from 'react';

export default function DeleteExperimentDialog({ open, onClose, experiment_id, project_id }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const { fetchProjects } = useContext(ProjectsContext); // Access refreshProjects from context

  const handleRefresh = () => {
    console.log("Refresh project is called in project details");

    fetchProjects(); // Call the function to trigger a refresh
  };

  const handleDelete = async () => {
    console.log("Project id in delete experiment: ", project_id)
    setLoading(true);
    try {
      const response = await axios.delete(`${endpoints.experiments.default}?pk=${experiment_id}`);
      if (response.status < 400) {
        onClose();
        handleRefresh();
        navigate('/dashboard/project/' + project_id);

      } else {
        console.error('Error deleting experiment:', response.data);
      }
    } catch (error) {
      console.error('Error deleting experiment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Experiment</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this experiment? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" variant="contained" autoFocus disabled={loading}>
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
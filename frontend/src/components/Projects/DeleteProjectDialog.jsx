import * as React from "react";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from "@mui/material";
import axios, { endpoints } from '../../utils/axios.js';
import { useNavigate} from "react-router-dom";
import {useContext} from 'react';

import {ProjectsContext} from '../../ProjectsProvider.jsx';

export default function DeleteProjectDialog({ open, onClose, id }) {
  const navigate = useNavigate();
  const { fetchProjects } = useContext(ProjectsContext); // Access refreshProjects from context

  const handleRefresh = () => {
    console.log("Refresh project is called in project details");

    fetchProjects(); // Call the function to trigger a refresh
  };
  const handleDelete = async () => {
    try {
      const response = await axios.delete(`${endpoints.projects}?pk=${id}`);
      if (response.code >= 400) {
        console.log(response)
        console.error('Error deleting project:');
      } else {
        const cachedProjects = localStorage.getItem('projects');
        console.log("before: ", cachedProjects)
        const filteredProjects = JSON.parse(cachedProjects).projects.filter((project) => project.pk !== parseInt(id))
        console.log("after: ", filteredProjects)
        localStorage.setItem(
          'projects',
          JSON.stringify({
            timestamp: new Date(),
            projects: filteredProjects
          })
        )
        onClose();
        handleRefresh();
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Project</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete this project? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" variant="contained" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
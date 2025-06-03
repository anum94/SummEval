import * as React from 'react';
import { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import CreateProjectDialog from './CreateProjectDialog.jsx';
import { SplashScreen } from '../Loading/index.js';
import axios, { endpoints } from '../../utils/axios.js';

const ProjectCard = ({ project }) => {
  return (
    <Card>
      <CardActionArea component={Link} to={`project/${project.pk}`} state={{ project: project }}>
        <CardContent sx={{ height: 200}}>
          <Stack direction="column" spacing={3} sx={{padding: '3px' }}>
            <Typography align="center" variant="h6" sx={{ borderBottom: '1px solid #E0E0E0', overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              whiteSpace: 'nowrap', }}>
              {project.fields.name}
            </Typography>
            <Typography align="center" variant="body2"  sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              whiteSpace: 'nowrap',
            }}>
              {project.fields.description || 'No description given.'}
            </Typography>
            <Stack
                direction="row"
                spacing={0.5}
                justifyContent="center"
                flexWrap="wrap"
                sx={{
                  textOverflow: 'ellipsis',
                  maxWidth: '100%', // Allow the stack to expand to the full width
                  overflow: 'hidden', // Ensure the tags don't overflow beyond the container
                }}
              >
            {project.fields.tags.length > 0
              ? project.fields.tags.some(tag => tag.length !== 0)
                ? project.fields.tags.map((tag) => (
                    tag.length !== 0 ? (
                      <Chip key={tag} label={tag} variant="outlined" />
                    ) : null
                  ))
                : <Typography variant="body2" color="textSecondary">No tag defined.</Typography>
              : <Typography variant="body2" color="textSecondary">No tag defined.</Typography>}

            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default function AllProjects() {
  // const projects = useLoaderData();
  const [openCreateProjectDialog, setOpenCreateProjectDialog] = React.useState(false);

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tags, setTags] = useState();

  useEffect(() => {
    const allTags = new Set(projects.map((project) => project.fields.tags).flat());

    const distinctTags = Array.from(allTags);
    setTags(distinctTags);
  }, [projects]);

  const [selectedTags, setSelectedTags] = useState([]);

  const addProject = (project) => {
    setProjects((currentProjects) => {
      const updatedProjects = currentProjects ? [...currentProjects, project] : [project];

      // Update cache
      localStorage.setItem(
        `projects`,
        JSON.stringify({
          timestamp: new Date(),
          projects: updatedProjects,
        })
      );

      return updatedProjects;
    });
  };

  const THIRTY_MINUTE_CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
  useEffect(() => {
    const cached_projects = localStorage.getItem(`projects`);
    if (
      cached_projects &&
      new Date() - new Date(JSON.parse(cached_projects).timestamp) <= THIRTY_MINUTE_CACHE_TIMEOUT
    ) {
      const parsed_projects = JSON.parse(cached_projects);
      setProjects(parsed_projects.projects);
      setLoading(false);
    } else {
      axios.get(endpoints.projects).then((response) => {
        if (response.status === 200) {
          const fetchedProjects = response.data;
          setProjects(fetchedProjects);
          setLoading(false);
          localStorage.setItem(
            `projects`,
            JSON.stringify({
              timestamp: new Date(),
              projects: fetchedProjects,
            })
          );
        }
      });
    }
  }, []);

  const handleChange = (event) => {
    setSelectedTags(event.target.value);
  };

  const handleInvitationResponse = async (projectId, status) => {
    try {
      await axios.patch(endpoints.projectInvitations.updateStatus, {
        project: projectId,
        status: status,
      });
      // Refresh projects after accepting/declining
      const response = await axios.get(endpoints.projects);
      if (response.status === 200) {
        setProjects(response.data);
        localStorage.setItem(
          `projects`,
          JSON.stringify({
            timestamp: new Date(),
            projects: response.data,
          })
        );
      }
    } catch (error) {
      console.error('Failed to update invitation status:', error);
      alert('Failed to update invitation status. Please try again.');
    }
  };

  const pendingInvitations = projects.filter(
    (project) => project.fields.invite_status === 'PENDING'
  );

  return loading ? (
    <Suspense fallback={<SplashScreen />} />
  ) : (
    <>
      {openCreateProjectDialog && (
        <CreateProjectDialog
          handleClose={() => setOpenCreateProjectDialog(false)}
          addProject={addProject}
        />
      )}
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar>
          <Typography sx={{ flex: '1 1 100%' }} variant="h3" id="tableTitle" component="div">
            Projects
          </Typography>
          <Tooltip title="Create a new project">
            <Button
              variant="outlined"
              startIcon={<Add />}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setOpenCreateProjectDialog(true)}
            >
              Create Project
            </Button>
          </Tooltip>
        </Toolbar>
        <Divider sx={{ mb: 2, mt: 2 }} />
        <Box sx={{ display: 'flex', mb: 2, justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, marginRight: 2 }}>
            {selectedTags.map((value) => (
              <Chip
                key={value}
                label={value}
                onDelete={() =>
                  setSelectedTags((prevTags) => prevTags.filter((tag) => tag !== value))
                }
                size="small"
                color="info"
                variant="soft"
              />
            ))}
          </Box>
          <FormControl variant="outlined" sx={{ width: 240, height: 75}}>
            <InputLabel id="multi-select-label" mb={2}>
              Filter by Tags
            </InputLabel>
            <Select
              labelId="multi-select-label"
              id="multi-select"
              label=" Filter by Tags"
              multiple
              value={selectedTags}
              onChange={handleChange}
            >
              {tags.length > 1 && tags.map((tag) => (
                <MenuItem key={tag} value={tag}>
                  {tag}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Grid container spacing={2}>
          {projects
            .filter(
              (project) =>
                project.fields.invite_status !== 'PENDING' &&
                (selectedTags.length === 0 ||
                  project.fields.tags.some((tag) => selectedTags.includes(tag)))
            )
            .map((project, index) => (
              <Grid item xs={12} md={3} key={index}>
                <ProjectCard project={project} />
              </Grid>
            ))}
        </Grid>

        <Divider sx={{ mb: 4, mt: 4 }} />

        {/* Invitations Section */}
        {pendingInvitations.length > 0 && (
          <>
            <Typography variant="h4" sx={{ mb: 2 }}>
              Pending Invitations
            </Typography>
            <Grid container spacing={2}>
              {pendingInvitations.map((project, index) => (
                <Grid item xs={12} md={3} key={index}>
                  <Card>
                    <CardContent sx={{ minHeight: 175 }}>
                      <Stack direction="column" spacing={3}>
                        <Typography align="center" variant="h6">
                          {project.fields.name}
                        </Typography>
                        <Typography align="center" variant="body2">
                          {project.fields.description || <br />}
                        </Typography>
                        <Stack direction="row" spacing={2} justifyContent="center">
                          <Button
                            variant="outlined"
                            color="success"
                            onClick={() => handleInvitationResponse(project.pk, 'ACCEPTED')}
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleInvitationResponse(project.pk, 'DECLINED')}
                          >
                            Decline
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Box>
    </>
  );
}

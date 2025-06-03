import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  Box,
  Collapse,
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Settings,
  AccountBox,
  List as ListIcon,
} from '@mui/icons-material';

import logo from '../../assets/cover.png';
import axios, { endpoints } from '../../utils/axios.js';

const drawerWidth = 240;

const ProjectDrawerItem = ({ project }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [experiments, setExperiments] = React.useState([]);

  const handleExpandClick = async () => {
    if (!expanded) {
      axios
        .get(`${endpoints.experiments.default}?project=${project.pk}`)
        .then((response) => {
          if (!response.data.ok) {
            console.log('Failed to fetch experiments');
            return;
          } else {
            setExperiments(response.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching experiments:', error);
        });
    }
    setExpanded(!expanded);
  };

  return (
    <Box>
      <ListItemButton
        key={project.pk}
        component={NavLink}
        to={`project/${project.pk}`}
        state={{ project: project }}
      >
        <ListItemIcon onClick={handleExpandClick}>
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </ListItemIcon>
        <ListItemText primary={<Typography variant="body">{project.fields.name}</Typography>} />
      </ListItemButton>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {experiments.map((experiment, index) => (
            <ListItemButton
              component={Link}
              to={`experiment/${experiment.pk}`}
              state={{ experiment: experiment }}
            >
              <ListItemText inset>
                <Typography variant="body2">{experiment.fields.name}</Typography>
              </ListItemText>
            </ListItemButton>
          ))}
        </List>
      </Collapse>
    </Box>
  );
};

export default function Drawer({ projects }) {
  return (
    <MuiDrawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#f5f5f5',
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <img src={logo} alt="logo" />
      <List>
        <ListItemButton component={Link} to="/my-workspace">
          <ListItemIcon>
            <ListIcon />
          </ListItemIcon>
          <ListItemText primary={<Typography variant="subtitle1">My Projects</Typography>} />
        </ListItemButton>
        {projects ? (
          projects.map((project, index) => <ProjectDrawerItem project={project} key={index} />)
        ) : (
          <Typography variant="body2" align="center">
            No projects found
          </Typography>
        )}
      </List>
      <Box sx={{ marginTop: 'auto' }}>
        <ListItemButton>
          <ListItemIcon>
            <Settings />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
        <Divider />
        <ListItem>
          <ListItemIcon>
            <AccountBox />
          </ListItemIcon>
          <ListItemText primary="Researcher" secondary="researcher@tum.de" />
        </ListItem>
      </Box>
    </MuiDrawer>
  );
}

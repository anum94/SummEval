import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import axiosInstance from '../../utils/axios.js';
import { endpoints } from '../../utils/axios.js';

export default function ShareProjectDialog({ open, onClose, id, projectName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [email, setEmail] = useState('');

  // Search function
  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`${endpoints.users.search}?query=${term}`);
      setUsers(response.data.results || []); 
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };


  // Handle selecting a user
  const handleSelectUser = (user) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  // Remove selected user
  const handleRemoveUser = (userToRemove) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userToRemove.id));
  };

  // Handle invite logic
  const handleInvite = async () => {
    try {
      const userIds = selectedUsers.map((user) => user.id);
  
      if (userIds.length > 0) {
        // Case 1: Invite registered users
        await axiosInstance.post(endpoints.projectInvitations.default, {
          project: id,
          user_ids: userIds,
        });
      //  console.log('Registered users invited successfully');
      }
  
      if (email) {
        // Case 2: Invite unregistered user via email
        await axiosInstance.post(endpoints.projectInvitations.default, {
          project: id,
          email: email,
        });
      //  console.log('Invitation sent to unregistered user via email');
      }
  
      onClose();
    } catch (error) {
      console.error('Error inviting users:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share {projectName}</DialogTitle>
      <DialogContent>
        {/* Search Field */}
        <TextField
          fullWidth
          label="Search Researchers"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          margin="normal"
        />

        {loading ? (
          <CircularProgress sx={{ mt: 2 }} />
        ) : searchTerm && users.length === 0 ? (
          <div>
            <Typography sx={{ mt: 2 }}>
              No researchers found. They might not be registered, please provide complete email to send invitations for them. 
            </Typography>

            {/* Manual Email Input */}
            <TextField
              fullWidth
              label="Enter email address"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              sx={{ mt: 2 }}
            />
          </div>
        ) : users.length > 0 ? (
          <List>
            {users.map((user) => (
              <ListItem key={user.id} button onClick={() => handleSelectUser(user)}>
                <ListItemText
                  primary={`${user.first_name} ${user.last_name}`}
                  secondary={user.email}
                />
              </ListItem>
            ))}
          </List>
        ) : null}

        {/* Display Selected Users */}
        {selectedUsers.length > 0 && (
          <div>
            <Typography sx={{ mt: 2 }}>Selected Users:</Typography>
            <List>
              {selectedUsers.map((user) => (
                <ListItem key={user.id} sx={{ pl: 0 }}>
                  <ListItemText
                    primary={`${user.first_name} ${user.last_name}`}
                    secondary={user.email}
                  />
                  <Button color="error" onClick={() => handleRemoveUser(user)}>
                    Remove
                  </Button>
                </ListItem>
              ))}
            </List>
          </div>
        )}

        {/* Send Invitation Button */}
        <Button
          fullWidth
          variant="contained"
          color="primary"
          onClick={handleInvite}
          disabled={selectedUsers.length === 0 && !email}
          sx={{ mt: 2, mb: 3 }}
        >
          Share Project
        </Button>
      </DialogContent>
    </Dialog>
  );
}

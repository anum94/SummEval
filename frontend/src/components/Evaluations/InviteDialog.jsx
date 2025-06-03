import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
} from '@mui/material';
import * as React from 'react';
import * as PropTypes from 'prop-types';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import * as Yup from 'yup';
import { endpoints } from '../../utils/axios.js';

TableCell.propTypes = {
  align: PropTypes.string,
  children: PropTypes.func,
};
export default function InviteDialog({ handleClose, projectId, experiments }) {
  const [invitees, setInvitees] = React.useState([]);
  const [newInvitee, setNewInvitee] = React.useState('');
  const [valError, setValError] = React.useState(false);
  const [error, setError] = React.useState('');

  const validationSchema = Yup.object().shape({
    newInvitee: Yup.string()
      .required('Email is required')
      .email('Please use a valid email address.'),
  });

  const addInvitee = async () => {
    try {
      await validationSchema.validate({ newInvitee });
      if (!invitees.includes(newInvitee)) {
        await setInvitees((prevInvitees) => [...prevInvitees, newInvitee]);
      }
      setNewInvitee('');
      setValError(false);
      setError('');
    } catch (error) {
      setValError(true);
      setError('Please enter a valid email address.');
    }
  };

  const deleteInvitee = (email) => {
    setInvitees((prevInvitees) => prevInvitees.filter((invitee) => invitee !== email));
  };

  const sendInvitations = async () => {
    if (invitees.length === 0) {
      setValError(true);
      setError('Please enter at least 1 invitee.');
      return;
    }
    axios
      .post(
        endpoints.invitation,
        {
          project: projectId,
          invitees: invitees,
        },
        {}
      )
      .then((response) => {
        if (!response.data.ok) {
          return response.data.json().then((data) => {
            setError(data.error);
          });
        } else {
          handleClose();
        }
      })
      .catch((error) => {
        console.error('Error posting invitation:', error);
      });
  };

  return (
    <Dialog open fullWidth>
      <DialogTitle>Invite annotators</DialogTitle>
      <DialogContent sx={{ height: 400 }}>
        <Grid container spacing={2}>
          <Grid item xs={9}>
            <TextField
              label="Email address"
              value={newInvitee}
              required
              error={valError}
              onChange={(e) => setNewInvitee(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <Button onClick={addInvitee} variant="contained">
              Add
            </Button>
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table>
                <TableBody>
                  {invitees.map((invitee, index) => (
                    <TableRow key={index}>
                      <TableCell>{invitee}</TableCell>
                      <TableCell align="right">
                        <Button onClick={() => deleteInvitee(invitee)}>
                          <DeleteOutlineIcon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={sendInvitations} variant="contained">
          Send invitations
        </Button>
      </DialogActions>
    </Dialog>
  );
}

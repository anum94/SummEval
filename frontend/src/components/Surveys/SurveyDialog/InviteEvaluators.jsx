import * as Yup from 'yup';
import {
  Box,
  Button,
  Card,
  DialogContent,
  FormControlLabel,
  FormGroup,
  Grid,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline.js';
import * as React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { HelpOutline } from '@mui/icons-material';

export default function InviteEvaluators({
  surveyName,
  setSurveyName,
  askForPersonalData,
  setAskForPersonalData,
  surveyEndDate,
  setSurveyEndDate,
  newInvitee,
  setNewInvitee,
  invitees,
  setInvitees,
  setError,
  valError,
  setValError,
}) {
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

  return (
    <DialogContent>
      <Card sx={{ borderRadius: '10px', flex: 1, height: '60vh'}}>
        <Toolbar>
          <Box display="flex" alignItems="center">
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
              Who should evaluate your experiments?
            </Typography>
            <Tooltip title="Invitees will be notified via email. They will be able to evaluate all summaries corresponding to your project articles. Evaluators have no notion about your experiments and project structure.">
              <IconButton>
                <HelpOutline />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        <Grid container spacing={2} sx={{ padding: '2%' }}>
          <Grid item xs={5}>
            <TextField
              label={'Survey name'}
              value={surveyName}
              onChange={(e) => setSurveyName(e.target.value)}
              required
              fullWidth
            ></TextField>
          </Grid>
          <Grid item xs={3}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Survey end date"
                sx={{ width: '100%' }}
                value={surveyEndDate}
                disablePast
                onChange={(newDate) => setSurveyEndDate(newDate)}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={4}>
            <Box display="flex" alignItems="center">
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={askForPersonalData}
                      onChange={(e) => setAskForPersonalData(!askForPersonalData)}
                    />
                  }
                  label="Learn more about my invitees"
                />
              </FormGroup>
              <Tooltip title="If selected, invitees will be asked to provide optional data regarding their role, study background, highest degree of study, and NLP experience. Invitees can decline to provide any data.">
                <IconButton>
                  <HelpOutline />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
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
            <Button onClick={addInvitee} variant="contained" sx={{ width: '100%', height: '100%' }}>
              Add
            </Button>
          </Grid>
          <Grid item xs={12}>
            <TableContainer
              component={Paper}
               sx={{
                borderRadius: '10px',
                maxHeight: '30vh', // Set the initial max height for the table
                overflow: 'auto', // Allow scrolling when content overflows
              }}
            >
              <Table>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invitee</TableCell>
                      <TableCell width={10}></TableCell>
                    </TableRow>
                  </TableHead>
                </Table>
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
      </Card>
    </DialogContent>
  );
}

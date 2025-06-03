import * as React from 'react';
import {
  Box,
  Button,
  Card,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { Share } from '@mui/icons-material';
import SurveyDialog from './SurveyDialog/SurveyDialog.jsx';
import { isBefore } from 'date-fns';

export default function MySurveys({ project, surveys, experiments, setSurveys }) {
  const [openSurveyDialog, setOpenSurveyDialog] = React.useState(false);

  const theme = useTheme();

  const addSurvey = (survey) => {
    setSurveys((currentSurveys) => {
      const updatedSurveys = currentSurveys ? [...currentSurveys, survey] : [survey];

      return updatedSurveys;
    });
  };

  return (
    <>
      {openSurveyDialog && (
        <SurveyDialog
          handleClose={() => setOpenSurveyDialog(false)}
          projectId={project.pk}
          experiments={experiments}
          surveys={surveys}
          setSurveys={setSurveys}
          addSurvey={addSurvey}
        />
      )}
      <Card variant="outlined" sx={{ borderRadius: '10px', flex: 1, height: '100%' }}>
        <Toolbar>
          <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
            Project Surveys
          </Typography>
          <div style={{ marginLeft: 20 }}>
            <Tooltip title="Invite annotators">
              <Button
                variant="outlined"
                startIcon={<Share />}
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setOpenSurveyDialog(true)}
              >
                Create Survey
              </Button>
            </Tooltip>
          </div>
        </Toolbar>
        {surveys.length === 0 ? (
          <Typography align="center" m={10}>
            No surveys yet
          </Typography>
        ) : (
          <Box sx={{ p: 2 }}>
            <TableContainer component={Paper} sx={{ borderRadius: '10px', maxHeight: 340 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Number of summaries</TableCell>
                    <TableCell align="center">Created at</TableCell>
                    <TableCell align="center">Active until</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {surveys
                    .sort(
                      (a, b) => new Date(b.fields.active_until) - new Date(a.fields.active_until)
                    )
                    .map((survey, index) => (
                      <TableRow
                        key={index}
                        component={Link}
                        to={`/dashboard/survey/${survey.pk}`}
                        state={{ survey: survey }}
                        sx={{
                          cursor: 'pointer',
                          textDecoration: 'none',
                          '&:hover': {
                            backgroundColor:
                              theme.palette.mode === 'light' ? '#e0e0e0' : theme.palette.grey[700],
                          },
                        }}
                      >
                        <TableCell>{survey.fields.name}</TableCell>
                        <TableCell align="center">{survey.fields.summaries.length}</TableCell>
                        <TableCell align="center">
                          {new Date(survey.fields.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell align="center">
                          {new Date(survey.fields.active_until).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell align="center">
                          {isBefore(survey.fields.active_until, new Date()) ? (
                            <Typography color={'red'}>Terminated</Typography>
                          ) : (
                            <Typography color={'green'}>Active</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>
    </>
  );
}

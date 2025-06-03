import * as React from 'react';
import { useEffect, useState } from 'react';
import Toolbar from '../Global/Toolbar.jsx';
import {
  Box,
  Button,
  Card,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Skeleton,
  Toolbar as MUIToolbar,
  Typography,
} from '@mui/material';
import { Link, useParams } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import HumanEvaluationDashboard from '../HumanEvaluationDashboard.jsx';
import { SplashScreen } from '../Loading/index.js';
import axios, { endpoints } from '../../utils/axios.js';

export default function SurveyDetails() {
  // const { survey, invitations, experiments } = useLoaderData();
  const [survey, setSurvey] = useState();
  const [invitations, setInvitations] = useState();
  const [experiment_scores, setExperiment_scores] = useState();
  const [surveyLoading, setSurveyLoading] = useState(true);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [experiment_scoresLoading, setExperiment_scoresLoading] = useState(true);
  const [editDeadline, setEditDeadline] = useState(false);
  const [deadline, setDeadline] = useState();
  const [dateString, setDateString] = useState();

  const [totalEvaluations, setTotalEaluations] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);

  const { survey_id } = useParams();

  const THIRTY_MINUTE_CACHE_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  function refreshExperimentEvaluations() {
    setExperiment_scoresLoading(true);

    axios
      .get(`${endpoints.survey.evaluations}?survey=${survey_id}`)
      .then((evaluationResponse) => {
        const scores = evaluationResponse.data;
        setExperiment_scores(scores);
        localStorage.setItem(
          `survey_evaluations_${survey_id}`,
          JSON.stringify({
            timestamp: new Date(),
            experiment_scores: scores,
          })
        );
        setExperiment_scoresLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching scores:', error);
        setExperiment_scoresLoading(false);
      });
  }

  useEffect(() => {
    axios
      .get(`${endpoints.survey.default}?survey=${survey_id}`)
      .then((surveyResponse) => {
        const survey = surveyResponse.data;
        setSurvey(survey[0]);
        setDeadline(survey[0].fields.active_until);
        setDateString(
          new Date(survey[0].fields.active_until).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        );
        setSurveyLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching survey:', error);
        setSurveyLoading(false);
      });

    axios
      .get(`${endpoints.invitation}?survey=${survey_id}`)
      .then((invitationResponse) => {
        const invitations = invitationResponse.data;
        setInvitations(invitations);
        setInvitationsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching invitations:', error);
        setInvitationsLoading(false);
      });

    const cached_survey_evaluations = localStorage.getItem(`survey_evaluations_${survey_id}`);
    if (
      cached_survey_evaluations &&
      new Date() - new Date(JSON.parse(cached_survey_evaluations).timestamp) <=
        THIRTY_MINUTE_CACHE_TIMEOUT
    ) {
      const parsed_cached_survey_evaluations = JSON.parse(cached_survey_evaluations);
      setExperiment_scores(parsed_cached_survey_evaluations.experiment_scores);
      setExperiment_scoresLoading(false);
    } else {
      refreshExperimentEvaluations();
    }
  }, []);

  useEffect(() => {
    if (!invitationsLoading && !surveyLoading) {
      const totalNumberOfEvaluations = invitations.reduce((sum, invitation) => {
        return sum + (invitation.fields.number_of_evaluations || 0);
      }, 0);

      setTotalEaluations(totalNumberOfEvaluations);
      setTotalProgress(
        Math.round(
          (totalNumberOfEvaluations / (survey.fields.summaries.length * invitations.length)) * 100
        )
      );
    }
  }, [invitations, survey]);

  const columns = [
    { field: 'id', headerName: 'Invitee', flex: 0.2 },
    {
      field: 'numberCompletedEvaluations',
      headerName: 'Completed evaluations',
      flex: 0.15,
    },
    {
      field: 'progress',
      headerName: 'Evaluation Progress',
      flex: 0.15,
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 0.1,
    },
    {
      field: 'background',
      headerName: 'Background',
      flex: 0.1,
    },
    {
      field: 'highest_degree',
      headerName: 'Highest Degree',
      flex: 0.1,
    },
    {
      field: 'nlp_experience',
      headerName: 'NLP Experience',
      flex: 0.1,
    },
  ];

  async function submitNewDeadline(e) {
    try {
      await axios.patch(
        endpoints.survey.default,
        { pk: survey.pk, active_until: deadline },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      setDateString(
        new Date(deadline).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    } catch (error) {
      setDeadline(survey.fields.active_until);
      alert('An error occurred. Please try again later.');
    }
    setEditDeadline(false);
  }

  async function downloadEvaluations() {
    try {
      const response = await axios.get(`${endpoints.evaluation}getCSV/?survey=${survey.pk}`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: 'text/csv;charset=utf-8;',
      });
      saveAs(blob, `all_evaluations_survey_${survey.fields.name}`);
    } catch (error) {
      alert('An error occurred. Please try again later.');
    }
  }

  return surveyLoading || invitationsLoading ? (
    <SplashScreen />
  ) : (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        bgcolor: 'background.paper',
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
        alignItems: 'left',
      }}
    >
      <Toolbar
        title={survey.fields.name}
        subtitles={[
          [
            'Active until:',
            <Box sx={{ display: 'flex', alignItems: 'center', height: 20 }}>
              {!editDeadline ? (
                dateString
              ) : (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    value={dayjs(deadline)}
                    onChange={(newDate) => setDeadline(newDate)}
                    disablePast
                    slotProps={{
                      textField: {
                        variant: 'standard',
                        p: 0,
                        ml: 1,
                      },
                    }}
                  />
                </LocalizationProvider>
              )}
              {!editDeadline ? (
                <IconButton
                  sx={{ p: 0, ml: 1, fontSize: 'inherit' }}
                  onClick={(e) => setEditDeadline(true)}
                >
                  <EditIcon sx={{ fontSize: 'inherit' }} />
                </IconButton>
              ) : (
                <>
                  <IconButton
                    sx={{ p: 0, ml: 1, fontSize: 'inherit' }}
                    onClick={(e) => {
                      setDeadline(survey.fields.active_until);
                      setEditDeadline(false);
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 'inherit' }} />
                  </IconButton>
                  <IconButton sx={{ p: 0, ml: 1, fontSize: 'inherit' }} onClick={submitNewDeadline}>
                    <CheckIcon sx={{ fontSize: 'inherit' }} />
                  </IconButton>
                </>
              )}
            </Box>,
          ],
          ['Number of summaries:', survey.fields.summaries.length],
          [
            'Metrics:',
            <Box sx={{ display: 'flex', gap: 2 }}>
              {survey.fields.metrics.map((metric, index) => (
                <Typography key={index}>{metric.name}</Typography>
              ))}
            </Box>,
          ],
          [
            'Experiments:',
            <>
              {experiment_scoresLoading ? (
                <Skeleton animation="wave" />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row', // Change to row
                    flexWrap: 'wrap', // Allow wrapping
                    gap: 1, // Adjust gap for spacing
                  }}
                >
                  {experiment_scores.data.map((exp, index) => (
                    <Card
                      key={index}
                      component={Link}
                      to={`../experiment/${exp.experiment.id}`}
                      sx={{
                        p: 1,
                        width: 'fit-content',
                        textDecoration: 'none',
                        transition: '0.3s',
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
                      }}
                    >
                      <Typography variant="body1" sx={{ color: 'black' }}>
                        {exp.experiment.name}
                      </Typography>
                    </Card>
                  ))}
                </Box>
              )}
            </>,
          ]
        ]}
        button={
          <Button
            startIcon={<DownloadIcon />}
            onClick={downloadEvaluations}
            style={{ whiteSpace: 'nowrap' }}
            variant={'contained'}
          >
            Download evaluations
          </Button>
        }
      ></Toolbar>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h5">
            You have received {totalEvaluations} of{' '}
            {survey.fields.summaries.length * invitations.length} evaluations.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress
                variant="determinate"
                value={totalProgress}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary" >{`${totalProgress}%`}</Typography>
            </Box>
          </Box>
        </Grid>

        <Grid item xs={12} sx={{ height: 500 }}>
          <Card variant="outlined" sx={{ borderRadius: '10px', flex: 1 }}>
            <MUIToolbar>
              <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
                All Invitations
              </Typography>
            </MUIToolbar>
            <Box sx={{ p: 2, height: 420 }}>
              <DataGrid
                rows={invitations.map((invitation, index) => {
                  return {
                    id: invitation.fields.email_address,
                    numberCompletedEvaluations: invitation.fields.number_of_evaluations,
                    progress: `${Math.round(
                      (invitation.fields.number_of_evaluations / survey.fields.summaries.length) *
                        100
                    )} %`,
                    role: invitation.fields.role,
                    background: invitation.fields.background,
                    highest_degree: invitation.fields.highest_degree,
                    nlp_experience: invitation.fields.nlp_experience,
                  };
                })}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                pageSizeOptions={[10, 20]}
                component={Paper}
                sx={{ borderRadius: '10px' }}
              />
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sx={{ height: 500 }}>
          <HumanEvaluationDashboard
            experiment_scores={experiment_scores}
            survey={survey}
            loading={experiment_scoresLoading}
            refresh={refreshExperimentEvaluations}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

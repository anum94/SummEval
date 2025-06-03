import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
} from '@mui/material';
import * as React from 'react';
import ChooseExperiments from './ChooseExperiments.jsx';
import InviteEvaluators from './InviteEvaluators.jsx';
import ChooseMetrics from './ChooseMetrics.jsx';
import dayjs from 'dayjs';
import axios, { endpoints } from '../../../utils/axios.js';
import LoadingButton from '@mui/lab/LoadingButton';

export default function SurveyDialog({ handleClose, projectId, experiments, addSurvey }) {
  // States for the stepper
  const [activeStep, setActiveStep] = React.useState(0);
  const steps = ['Select experiments', 'Choose metrics', 'Invite evaluators'];

  // States for selecting experiments
  const [selectedExperiments, setSelectedExperiments] = React.useState(
    experiments.map((exp) => exp.pk)
  );

  // States for choosing metrics
  const [highlightQuestion, setHighlightQuestion] = React.useState();
  const [newMetric, setNewMetric] = React.useState({
    name: '',
    definition: '',
  });
  const [selectedMetrics, setSelectedMetrics] = React.useState([
    {
      name: 'Accuracy',
      definition:
        'How well the summary reflects the information and facts presented in the original full-text article.',
    },
    {
      name: 'Correctness',
      definition:
        'The extent to which the summary is free from errors, including factual inaccuracies, grammatical mistakes, and typographical errors.',
    },
    {
      name: 'Readability',
      definition:
        'The ease with which the summary can be read and understood, considering factors like clarity, coherence, and flow of the text.',
    },
    {
      name: 'Relevance',
      definition:
        'How well the summary includes the most important and pertinent information from the full-text article, omitting trivial or unrelated details.',
    },
  ]);

  // States for inviting evaluators
  const [surveyName, setSurveyName] = React.useState('');
  const [askForPersonalData, setAskForPersonalData] = React.useState(true);
  const [surveyEndDate, setSurveyEndDate] = React.useState(dayjs().add(7, 'day'));
  const [invitees, setInvitees] = React.useState([]);
  const [newInvitee, setNewInvitee] = React.useState('');
  const [error, setError] = React.useState('');
  const [valError, setValError] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Functions for the stepper
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const createSurvey = async () => {
    if (invitees.length === 0) {
      setValError(true);
      setError('Please enter at least 1 invitee.');
      return;
    }
    await setSubmitting(true);
    await axios
      .post(
        endpoints.survey.default,
        {
          project: projectId,
          experiment_ids: selectedExperiments,
          metrics: selectedMetrics,
          highlight_question: highlightQuestion,
          survey_name: surveyName,
          ask_for_personal_data: askForPersonalData,
          survey_end_date: surveyEndDate,
          invitees: invitees,
        },
        {}
      )
      .then((response) => {
        if (!response.status === 201) {
          setError(response.data.error);
        } else {
          const newSurvey = response.data[0];
          addSurvey(newSurvey);
          handleClose();
        }
      })
      .catch((error) => {
        console.error('Error creating survey:', error);
      });
    setSubmitting(false);
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth={false} // Disable the default maxWidth
      PaperProps={{
        style: {
          width: '55vw',
          height: '90vh',
        },
      }}
    >
      <DialogTitle>Create Survey</DialogTitle>
      <Stepper activeStep={activeStep} sx={{ padding: '3%' }}>
        {steps.map((label, index) => {
          const stepProps = {};
          const labelProps = {};
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          );
        })}
      </Stepper>

      {activeStep === 0 && (
        <ChooseExperiments
          experiments={experiments}
          selectedExperiments={selectedExperiments}
          setSelectedExperiments={setSelectedExperiments}
        />
      )}
      {activeStep === 1 && (
        <ChooseMetrics
          newMetric={newMetric}
          setNewMetric={setNewMetric}
          highlightQuestion={highlightQuestion}
          setHighlightQuestion={setHighlightQuestion}
          selectedMetrics={selectedMetrics}
          setSelectedMetrics={setSelectedMetrics}
        />
      )}
      {activeStep === 2 && (
        <InviteEvaluators
          surveyName={surveyName}
          setSurveyName={setSurveyName}
          askForPersonalData={askForPersonalData}
          setAskForPersonalData={setAskForPersonalData}
          surveyEndDate={surveyEndDate}
          setSurveyEndDate={setSurveyEndDate}
          newInvitee={newInvitee}
          setNewInvitee={setNewInvitee}
          invitees={invitees}
          setInvitees={setInvitees}
          setError={setError}
          valError={valError}
          setValError={setValError}
        />
      )}

      <DialogActions>
        {error && <Alert severity="error">{error}</Alert>}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <Button onClick={handleClose}>Cancel</Button>
          <Button color="inherit" disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
            Back
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep < steps.length - 1 && (
            <Button
              onClick={handleNext}
              disabled={
                (activeStep === 0 && selectedExperiments.length == 0) ||
                (activeStep === 1 && selectedMetrics.length == 0)
              }
            >
              Next
            </Button>
          )}
          {activeStep === steps.length - 1 && (
            <LoadingButton onClick={createSurvey} loading={submitting} variant="contained">
              Create Survey
            </LoadingButton>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}

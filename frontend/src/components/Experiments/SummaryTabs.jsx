import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, HelpOutline } from '@mui/icons-material';
import AutoEvaluationTable from '../AutoEvaluationTable.jsx';
import HumanEvaluationInsights from './HumanEvaluationInsights.jsx';
import axios, { endpoints } from '../../utils/axios.js';
import DomainAdaptation from './DomainAdaptation.jsx';
import TaskOverlay from '../Tasks/TaskOverlay.jsx';

const allMetrics = [
  'bartscore',
  'bertscore',
  'bleu',
  'meteor',
  'rouge',
  'unieval',
  'llm_evaluation',
  'factscore',
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function SummaryTabs({
  experimentId,
  summaryData,
  humanEvaluations,
  loading,
  hasPagination,
  currentPage,
  onAddMetric,
}) {
  const [summaries, setSummaries] = React.useState(summaryData);
  const [value, setValue] = React.useState(0);
  const [openAddMetric, setOpenAddMetric] = React.useState(false);
  const [metric, setMetric] = React.useState('');
  const [api_key, setApiKey] = React.useState('');
  const [isPolling, setIsPolling] = React.useState(false);
  let startPollingTask = null;
  const cacheKey = experimentId;

  React.useEffect(() => {
    setSummaries(summaryData || []);
  }, [summaryData]);
  console.log('summary data', summaries);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleAddMetric = async () => {
    if (!summaries[value]?.fields) return;
    try {
      const response = await axios.post(
        endpoints.autoEvaluation,
        {
          experiment: summaries[value].fields.experiment,
          metric,
          api_key,
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('Metric added:', response.data);

      if (startPollingTask) {
        startPollingTask();
      }
    } catch (error) {
      console.error('Error adding metric:', error);
    }
    setOpenAddMetric(false);
  };

  if (loading) {
    // Show loading state when summaries are being fetched
    return (
      <Typography align="center" sx={{ p: 4 }}>
        Loading summaries...
      </Typography>
    );
  }

  if (!summaries || summaries.length === 0) {
    // Handle case where no summaries are available
    return (
      <Typography align="center" sx={{ p: 4 }}>
        No summaries available.
      </Typography>
    );
  }

  return (
    <>
      <Dialog open={openAddMetric} onClose={() => setOpenAddMetric(false)}>
        <DialogTitle>
          <Typography variant="h6">Select New Metric to Add to All Summaries</Typography>
          <Typography variant="body2">The metric will be calculated in the background</Typography>
        </DialogTitle>
        <DialogContent>
          <Box display="flex" justifyContent="center" flexDirection="column">
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel id="add-metric-label">Metric</InputLabel>
              <Select
                labelId="add-metric-label"
                id="add-metric"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                input={<OutlinedInput label="Metric" />}
              >
                {allMetrics.map((metric, i) => (
                  <MenuItem
                    value={metric}
                    disabled={
                      summaries[value].fields.evaluation_results !== null &&
                      summaries[value].fields.evaluation_results[metric] &&
                      Object.keys(summaries[value].fields.evaluation_results[metric]).length > 0
                    }
                  >
                    {metric}
                  </MenuItem>
                ))}
              </Select>
              {metric === 'llm_evaluation' && (
                <>
                  <Typography variant="body2" mt={2} mb={1}>
                    Please enter the API key for the LLM evaluation service
                  </Typography>
                  <TextField
                    id="api-key"
                    label="API Key"
                    variant="outlined"
                    value={api_key}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </>
              )}
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddMetric(false)}>Cancel</Button>
          {loading ? (
            <Button variant="contained" disabled>
              Loading...
            </Button>
          ) : (
            <Button variant="contained" disabled={!metric} onClick={() => handleAddMetric()}>
              Add
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Box sx={{ width: '100%' }}>
        {!summaries ? (
          <Typography sx={{ p: 2 }}>No summaries available</Typography>
        ) : (
          <Box sx={{ width: '100%', px: 2 }}>
            <Box ml={4}>
              <Tabs value={value} onChange={handleChange}>
                {summaries.map((summary, index) => (
                  <Tab label={`Sample ${index + 1}`} {...a11yProps(index)} />
                ))}
              </Tabs>
            </Box>

            {summaries.map((summary, index) => (
              <TabPanel value={value} index={index}>
                <Grid container spacing={2} direction="row" justify="center" alignItems="stretch">
                  <Grid item xs={6}>
                    {humanEvaluations &&
                    humanEvaluations.find((humanEval) => humanEval.summary_id === summary.pk) &&
                    humanEvaluations.find((humanEval) => humanEval.summary_id === summary.pk)
                      .evaluations ? (
                      <HumanEvaluationInsights
                        summary={summary.fields.summary}
                        evaluations={
                          humanEvaluations.find((humanEval) => humanEval.summary_id === summary.pk)
                            .evaluations
                        }
                      />
                    ) : (
                      <div>Loading evaluations...</div>
                    )}
                  </Grid>

                  <Grid item xs={6}>
                    <Card variant="outlined" sx={{ height: '100%' }}>
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                              <Typography variant="h6" align="center">
                                Automatic Evaluation Results
                              </Typography>

                              <Tooltip
                                title={
                                  <Typography>
                                    This table shows all the automatically calculated scores across
                                    for the selected summary. You can calculate more metrics below.
                                  </Typography>
                                }
                              >
                                <IconButton>
                                  <HelpOutline />
                                </IconButton>
                              </Tooltip>

                              <Button
                                startIcon={<Add />}
                                onClick={() => setOpenAddMetric(true)}
                                variant="outlined"
                                sx={{ marginLeft: 'auto' }}
                                disabled={isPolling}
                              >
                                Add new metric
                              </Button>
                            </Box>
                          </Grid>
                          <Grid xs={12}>
                            <TaskOverlay
                              cacheKey={cacheKey}
                              onPollingChange={(isPolling) => {
                                setIsPolling(isPolling);
                              }}
                              onPollingComplete={(isComplete) => {
                                if (isComplete) {
                                  onAddMetric();
                                }
                              }}
                            >
                              {(startTask) => {
                                startPollingTask = startTask;

                                return (
                                  <AutoEvaluationTable
                                    evaluation_results={summary.fields.evaluation_results}
                                    setOpenAddMetric={setOpenAddMetric}
                                  />
                                );
                              }}
                            </TaskOverlay>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Box sx={{ width: '100%', mt: 2, ml: 2 }}>
                    <DomainAdaptation
                      currentExperimentSummary={
                        summary.fields.summary || summary.fields.generated_summary
                      }
                      summaryIndex={index}
                      databaseIndex={summary.fields.index}
                      hasPagination={hasPagination}
                      currentPage={currentPage}
                    />
                  </Box>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                              <Typography variant="h6" align="center">
                                Prompt
                              </Typography>
                              <Tooltip
                                title={
                                  <Typography>
                                    The prompt you have generated the summary with, if specified
                                    upon experiment creation.
                                  </Typography>
                                }
                              >
                                <IconButton>
                                  <HelpOutline />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body" align="justify">
                              {summary.fields.prompt}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                              <Typography variant="h6" align="center">
                                Full text
                              </Typography>
                              <Tooltip title={<Typography>Full text from the project.</Typography>}>
                                <IconButton>
                                  <HelpOutline />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body" sx={{ textAlign: 'justify' }}>
                              {summary.fields.full_text}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <Box display="flex" alignItems="center">
                              <Typography variant="h6" align="center">
                                Reference Summary
                              </Typography>
                              <Tooltip
                                title={
                                  <Typography>
                                    The reference summary that you uploaded when creating this
                                    project.
                                  </Typography>
                                }
                              >
                                <IconButton>
                                  <HelpOutline />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body" sx={{ textAlign: 'justify' }}>
                              {summary.fields.reference_summary}
                            </Typography>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {!summary.fields.generated_summary && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Box display="flex" alignItems="center">
                                <Typography variant="h6" align="center">
                                  Predicted Summary
                                </Typography>
                                <Tooltip
                                  title={
                                    <Typography>
                                      The predicted summary from CSV uploaded.
                                    </Typography>
                                  }
                                >
                                  <IconButton>
                                    <HelpOutline />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body" sx={{ textAlign: 'justify' }}>
                                {summary.fields.summary}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  {summary.fields.summarization_model && (
                    <Grid item xs={12}>
                      <Card variant="outlined">
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Box display="flex" alignItems="center">
                                <Typography variant="h6" align="center">
                                  Summary of the Model
                                </Typography>
                                <Tooltip
                                  title={
                                    <Typography>
                                      Summary of the {summary.fields.summarization_model} model
                                    </Typography>
                                  }
                                >
                                  <IconButton>
                                    <HelpOutline />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body" sx={{ textAlign: 'justify' }}>
                                {summary.fields.generated_summary}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                </Grid>
              </TabPanel>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}

SummaryTabs.propTypes = {
  experimentId: PropTypes.string,
  summaryData: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      summary: PropTypes.string.isRequired,
    })
  ).isRequired,
  humanEvaluations: PropTypes.arrayOf(
    PropTypes.shape({
      evaluationId: PropTypes.number,
      score: PropTypes.number,
    })
  ),
  loading: PropTypes.bool.isRequired,
  hasPagination: PropTypes.bool,
  currentPage: PropTypes.number.isRequired,
};

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Switch,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios, { endpoints } from '../../utils/axios.js';
import Skeleton from '@mui/material/Skeleton';
import ReactDiffViewer from 'react-diff-viewer-continued';

// Custom Hook for filtering experiments and fetching summaries
function useOtherExperiments(
  currentExperimentPrimaryKey,
  experiments,
  enablePagination = false,
  currentPage,
  summaryIndex
) {
  const [otherExperiments, setOtherExperiments] = useState([]);
  const [summaries, setSummaries] = useState({});
  const fetchedExperiments = React.useRef(new Set());

  const fetchSummariesForExperiment = async (exp) => {
    try {
      const response = await axios.get(
        enablePagination
          ? `${endpoints.experiments.getPaginatedSummaries}`
          : `${endpoints.experiments.getById}`,
        {
          params: {
            experiment: exp.pk,
            ...(enablePagination ? { page: currentPage } : {}), // Include page only if pagination is enabled
          },
        }
      );
      const fetchedSummaries = enablePagination
        ? response.data?.fields?.summaries || []
        : response.data[0]?.fields?.summaries || [];

      setSummaries((prev) => ({
        ...prev,
        [exp.pk]: fetchedSummaries,
      }));
    } catch (error) {
      console.error(`Error fetching summaries for experiment ${exp.pk}:`, error);
    }
  };

  useEffect(() => {
    if (currentExperimentPrimaryKey && experiments) {
      const filteredExperiments = experiments.filter(
        (exp) => Number(exp.pk) !== Number(currentExperimentPrimaryKey)
      );
      setOtherExperiments(filteredExperiments);

      filteredExperiments.forEach((exp) => {
        if (!fetchedExperiments.current.has(exp.pk)) {
          fetchedExperiments.current.add(exp.pk);
          fetchSummariesForExperiment(exp, currentPage);
        }
      });
    }
  }, [currentExperimentPrimaryKey, experiments, enablePagination, currentPage, summaryIndex]);
  return { otherExperiments, summaries, fetchSummariesForExperiment };
}

function AtomicFacts({
  otherExperimentAtomicFacts,
  currentExperimentAtomicFacts,
  otherExperimentSelectedSentenceIndex,
  currentExperimentSelectedSentenceIndex,
}) {
  const [compareAllFacts, setCompareAllFacts] = useState(false);

  // Helper function to collect facts (either all facts or sentence-specific)
  const getFacts = (experimentFacts, selectedIndex, allFacts) => {
    if (allFacts) {
      return new Set(Object.values(experimentFacts).flat());
    }
    return new Set(experimentFacts[selectedIndex] || []);
  };

  // Get facts based on toggle state
  const otherFacts = useMemo(
    () =>
      getFacts(otherExperimentAtomicFacts, otherExperimentSelectedSentenceIndex, compareAllFacts),
    [otherExperimentAtomicFacts, otherExperimentSelectedSentenceIndex, compareAllFacts]
  );

  const currentFacts = useMemo(
    () =>
      getFacts(
        currentExperimentAtomicFacts,
        currentExperimentSelectedSentenceIndex,
        compareAllFacts
      ),
    [currentExperimentAtomicFacts, currentExperimentSelectedSentenceIndex, compareAllFacts]
  );

  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <>
      <Typography variant="h4" align="center" gutterBottom>
        Atomic Facts
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={compareAllFacts}
            onChange={() => setCompareAllFacts((prev) => !prev)}
            color="primary"
          />
        }
        label="Compare all atomic facts (Default is Sentence-by-Sentence comparison)"
      />
      <ReactDiffViewer
        oldValue={[...otherFacts].join('\n')}
        newValue={[...currentFacts].join('\n')}
        splitView={true}
        disableWordDiff={true}
        showDiffOnly={false}
        useDarkTheme={isDarkMode}
        hideLineNumbers={true}
      />
    </>
  );
}

function ParagraphWithSentenceHighlight({ sentences, onSentenceClicked }) {
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState(null);
  const [clickedSentenceIndex, setClickedSentenceIndex] = useState(null);

  const handleMouseEnter = useCallback((index) => setHoveredSentenceIndex(index), []);
  const handleMouseClicked = useCallback((index) => {
    setClickedSentenceIndex(index);
    onSentenceClicked(index);
  }, []);

  const handleMouseLeave = useCallback(() => setHoveredSentenceIndex(null), []);

  const theme = useTheme();
  const hoverBackgroundColor = theme.palette.primary.main;

  return (
    <>
      {sentences.map((sentence, index) => (
        <Box
          key={index}
          component="span"
          sx={{
            display: 'inline',
            cursor: 'pointer',
            padding: '0 4px',
            backgroundColor:
              hoveredSentenceIndex === index || clickedSentenceIndex === index
                ? hoverBackgroundColor
                : 'transparent',
            transition: 'background-color 0.3s ease-out',
          }}
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleMouseClicked(index)}
        >
          {sentence}
        </Box>
      ))}
    </>
  );
}

export default function DomainAdaptation({
  currentExperimentSummary,
  summaryIndex,
  databaseIndex,
  hasPagination,
  currentPage,
}) {
  const location = useLocation();
  const params = useParams();

  const projectId = params.id;
  const experimentId = params.experiment_id;

  const [selectedExperimentIndex, setSelectedExperimentIndex] = useState(0);
  const [experiments, setExperiments] = useState(null);

  useEffect(() => {
    if (location.state != null) {
      setExperiments(location.state.experiments);
    } else {
      try {
        axios.get(`${endpoints.experiments.summary}?project=${projectId}`).then((response) => {
          if (response.status === 200) {
            const fetchedExperiments = response.data.map((experiment) => ({
              ...experiment,
              fields: {
                name: experiment.fields.name,
                llm_name: experiment.fields.llm_name,
                context_window: experiment.fields.context_window,
                max_new_tokens: experiment.fields.max_new_tokens,
                evaluation_results: experiment.fields.evaluation_results,
                supportsPagination: experiment.fields.supportsPagination,
                indexedRange: experiment.fields.indexedRange, // index range
                indices: experiment.fields.indexedRange?.indices || [], // exact indices
                owner: experiment.fields.owner,
                project: experiment.fields.project,
              },
            }));
            setExperiments(fetchedExperiments);
            console.log('DA => Transformed Experiments:', fetchedExperiments);
          }
        });
      } catch (error) {
        console.error('DA => Error fetching experiments:', error);
      }
    }
  }, [location, projectId]);

  const { otherExperiments, summaries, _ } = useOtherExperiments(
    experimentId,
    experiments,
    hasPagination,
    currentPage,
    summaryIndex
  );

  // Manage state for current experiment
  const [currentExperimentState, setcurrentExperimentState] = useState({
    status: 'initial', // 'initial' | 'loading' | 'data' | 'error'
    sentences: [],
    atomicFacts: [],
    selectedSentenceIndex: 0,
  });

  // Manage state for other experiment
  const [otherExperimentState, setOtherExperimentState] = useState({
    status: 'initial', // 'initial' | 'loading' | 'data' | 'error'
    sentences: [],
    atomicFacts: [],
    selectedSentenceIndex: 0,
  });

  const atomicFactsCache = useRef(new Map()); // Stores in-memory results

  const atomicFactsApiCallInProgress = useRef(false);

  const noRelevantSummaryError = 'No Relevant Summary Available';

  const getRelevantSummary = useCallback(() => {
    const otherExperiment = otherExperiments[selectedExperimentIndex];
    if (!otherExperiment || !summaries[otherExperiment.pk]) return noRelevantSummaryError;

    const relevantSummary = summaries[otherExperiment.pk].find(
      (summary) => summary.fields.index === databaseIndex
    );

    return relevantSummary
      ? relevantSummary.fields.summary || relevantSummary.fields.generated_summary
      : noRelevantSummaryError;
  }, [databaseIndex, otherExperiments, selectedExperimentIndex, summaries, noRelevantSummaryError]);

  // --- Effect for fetching atomic facts for the current experiment ---
  useEffect(() => {
    const fetchCurrentExperimentAtomicFacts = async () => {
      // If data is already loaded, don't refetch.
      if (currentExperimentState.status === 'data') return;

      setcurrentExperimentState((prev) => ({ ...prev, status: 'loading' }));

      try {
        if (atomicFactsApiCallInProgress.current) return;
        atomicFactsApiCallInProgress.current = true;

        if (!currentExperimentSummary) {
          console.warn('Current experiment summary is not available.');
          setcurrentExperimentState((prev) => ({ ...prev, status: 'error' }));
          return;
        }

        const currentRes = await axios.post(endpoints.atomicFactsForParagraph, {
          paragraph: currentExperimentSummary,
        });
        const currentData = currentRes.data;

        if (currentData && currentData.atomic_facts) {
          const sentences = currentData.atomic_facts.map((item) => item.sentence);
          const atomicFacts = currentData.atomic_facts.map((item) => item.facts);
          setcurrentExperimentState({ status: 'data', sentences, atomicFacts });
        } else {
          console.warn('No atomic facts received for current experiment.');
          setcurrentExperimentState((prev) => ({ ...prev, status: 'error' }));
        }
      } catch (error) {
        console.error('Error fetching atomic facts for current experiment:', error);
        setcurrentExperimentState((prev) => ({ ...prev, status: 'error' }));
      } finally {
        atomicFactsApiCallInProgress.current = false;
      }
    };

    fetchCurrentExperimentAtomicFacts();
    // Only re-run when the summary changes.
  }, [currentExperimentSummary]);

  // --- Effect for fetching atomic facts for the other experiment ---
  useEffect(() => {
    const fetchOtherExperimentAtomicFacts = async () => {
      try {
        if (atomicFactsApiCallInProgress.current) return;
        atomicFactsApiCallInProgress.current = true;

        let otherData = null;
        if (otherExperiments && otherExperiments.length > 0) {
          setOtherExperimentState((prev) => ({ ...prev, status: 'loading' }));
          const otherExperimentSummary = getRelevantSummary();
          if (otherExperimentSummary && otherExperimentSummary !== noRelevantSummaryError) {
            const cacheKey = JSON.stringify({ paragraph: otherExperimentSummary });

            // Check if data is already in cache
            if (atomicFactsCache.current.has(cacheKey)) {
              console.log('Using cached atomic facts');
              otherData = atomicFactsCache.current.get(cacheKey);
            } else {
              console.log('Fetching new atomic facts');
              const otherRes = await axios.post(endpoints.atomicFactsForParagraph, {
                paragraph: otherExperimentSummary,
              });
              otherData = otherRes.data;

              // ✅ Store result in cache
              atomicFactsCache.current.set(cacheKey, otherData);
            }
          } else {
            console.warn('Invalid summary data for the selected other experiment.');
          }
        } else {
          console.warn('No other experiments available to fetch atomic facts for.');
        }

        if (otherData && otherData.atomic_facts) {
          const sentences = otherData.atomic_facts.map((item) => item.sentence);
          const atomicFacts = otherData.atomic_facts.map((item) => item.facts);
          setOtherExperimentState({ status: 'data', sentences, atomicFacts });
        } else {
          // If no data, we show error.
          setOtherExperimentState((prev) => ({ ...prev, status: 'error' }));
        }
      } catch (error) {
        console.error('Error fetching atomic facts for other experiment:', error);
        setOtherExperimentState((prev) => ({ ...prev, status: 'error' }));
      } finally {
        atomicFactsApiCallInProgress.current = false;
        console.log(otherExperimentState);
      }
    };

    fetchOtherExperimentAtomicFacts();
  }, [otherExperiments, selectedExperimentIndex, summaryIndex, getRelevantSummary]);

  const handleTabChange = (_, newIndex) => {
    setSelectedExperimentIndex(newIndex);
  };

  // --- UI Render Helpers ---

  // Renders a placeholder sentence for initial and error states.
  const renderPlaceholderSentence = (text = 'No data available.') => (
    <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
      {text}
    </Typography>
  );

  // Renders the current experiment's content based on its state.
  const renderCurrentExperimentContent = () => {
    switch (currentExperimentState.status) {
      case 'loading':
        return (
          <>
            <Box mt={3} sx={{ display: 'block', whiteSpace: 'normal' }}>
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="text" width="80%" height={30} />
              <Skeleton variant="text" width="60%" height={30} />
            </Box>
          </>
        );
      case 'data':
        return (
          <>
            <Box mt={3} sx={{ display: 'inline-block', whiteSpace: 'normal' }}>
              <ParagraphWithSentenceHighlight
                sentences={currentExperimentState.sentences}
                onSentenceClicked={(index) => {
                  setcurrentExperimentState((prev) => ({ ...prev, selectedSentenceIndex: index }));
                }}
              />
            </Box>
          </>
        );
      case 'error':
      case 'initial':
      default:
        return renderPlaceholderSentence('Current experiment data unavailable.');
    }
  };

  // Renders the other experiment's content based on its state.
  const renderOtherExperimentContent = () => {
    switch (otherExperimentState.status) {
      case 'loading':
        return (
          <>
            <Box mt={3} sx={{ display: 'block', whiteSpace: 'normal' }}>
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="text" width="100%" height={30} />
              <Skeleton variant="text" width="80%" height={30} />
              <Skeleton variant="text" width="60%" height={30} />
            </Box>
          </>
        );
      case 'data':
        return (
          <>
            <Box mt={3} sx={{ display: 'inline-block', whiteSpace: 'normal' }}>
              <ParagraphWithSentenceHighlight
                sentences={otherExperimentState.sentences}
                onSentenceClicked={(index) => {
                  setOtherExperimentState((prev) => ({ ...prev, selectedSentenceIndex: index }));
                }}
              />
            </Box>
          </>
        );
      case 'error':
      case 'initial':
      default:
        return renderPlaceholderSentence('Other experiment data unavailable.');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h3" align="center">
            Domain Adaptation
          </Typography>
          <br />
          <Grid container spacing={2} direction="row" justifyContent="center" alignItems="stretch">
            {/* Other Experiment Column */}
            <Grid item xs={6}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h4" align="left">
                    Other Experiment Summaries
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Box ml={2} mr={2}>
                    <Tabs value={selectedExperimentIndex} onChange={handleTabChange}>
                      {otherExperiments.map((exp, index) => (
                        <Tab label={exp.fields.name} key={index} />
                      ))}
                    </Tabs>
                  </Box>
                  {renderOtherExperimentContent()}
                </Grid>
              </Grid>
            </Grid>

            {/* Current Experiment Column */}
            <Grid item xs={6}>
              <Grid container spacing={2}>
                <Grid item xs={12} display="flex" alignItems="center">
                  <Typography variant="h4" align="left">
                    Current Experiment Summary
                  </Typography>
                  <Typography variant="h6" align="left" ml={2} color="text.secondary">
                    # {databaseIndex + 1 ?? 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} marginTop={6}>
                  {renderCurrentExperimentContent()}
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <br />
          {/* Only show Atomic Facts when both current and other experiments have data */}
          {currentExperimentState.status === 'data' && otherExperimentState.status === 'data' && (
            <AtomicFacts
              currentExperimentAtomicFacts={currentExperimentState.atomicFacts}
              otherExperimentAtomicFacts={otherExperimentState.atomicFacts}
              currentExperimentSelectedSentenceIndex={currentExperimentState.selectedSentenceIndex}
              otherExperimentSelectedSentenceIndex={otherExperimentState.selectedSentenceIndex}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

AtomicFacts.propTypes = {
  otherExperimentAtomicFacts: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  currentExperimentAtomicFacts: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  otherExperimentSelectedSentenceIndex: PropTypes.number,
  currentExperimentSelectedSentenceIndex: PropTypes.number,
};

ParagraphWithSentenceHighlight.propTypes = {
  sentences: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSentenceClicked: PropTypes.func,
};

DomainAdaptation.propTypes = {
  currentExperimentSummary: PropTypes.string.isRequired,
  summaryIndex: PropTypes.number.isRequired,
  databaseIndex: PropTypes.number,
  hasPagination: PropTypes.bool,
  currentPage: PropTypes.number.isRequired,
};

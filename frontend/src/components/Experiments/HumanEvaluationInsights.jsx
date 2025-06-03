import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Typography,
  Slider,
  Box,
  Paper,
  TextField,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import { ArrowForward, ArrowBack, HelpOutline } from '@mui/icons-material';
import '../TextDisplay.css';
import SummaryHighlight from '../SummaryHighlight.jsx';

const TextDisplay = ({ summary, evaluations }) => {
  const [currentEvaluationIndex, setCurrentEvaluationIndex] = useState(0);
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const [ratings, setRatings] = useState(
    evaluations.length > 0 ? evaluations[currentEvaluationIndex].ratings : {}
  );
  const [comment, setComment] = useState(
    evaluations.length > 0 ? evaluations[currentEvaluationIndex].comment : ''
  );
  const [highlights, setHighlights] = useState(
    evaluations.length > 0 ? evaluations[currentEvaluationIndex].highlights : {}
  );
  const [highlightError, setHighlightError] = useState(false);

  useEffect(() => {
    if (evaluations.length > 0) {
      console.log('Evaluations:', evaluations);
      setRatings(evaluations[currentEvaluationIndex].ratings);
      setComment(evaluations[currentEvaluationIndex].comment);
      setHighlights(evaluations[currentEvaluationIndex].highlights);
    }
  }, [evaluations, currentEvaluationIndex]);

  const handleNextEvaluation = () => {
    const nextIndex = (currentEvaluationIndex + 1) % evaluations.length;
    setCurrentEvaluationIndex(nextIndex);
    setCurrentMetricIndex(0);
    rerenderEvaluations(nextIndex);
  };

  const handlePreviousEvaluation = () => {
    const prevIndex = (currentEvaluationIndex - 1 + evaluations.length) % evaluations.length;
    setCurrentEvaluationIndex(prevIndex);
    setCurrentMetricIndex(0);
    rerenderEvaluations(prevIndex);
  };

  const handleNextMetric = () => {
    const nextMetricIndex = (currentMetricIndex + 1) % Object.keys(ratings).length;
    setCurrentMetricIndex(nextMetricIndex);
  };

  const handlePreviousMetric = () => {
    const prevMetricIndex = (currentMetricIndex - 1 + Object.keys(ratings).length) % Object.keys(ratings).length;
    setCurrentMetricIndex(prevMetricIndex);
  };

  const rerenderEvaluations = async (index) => {
    setRatings(evaluations[index].ratings);
    setComment(evaluations[index].comment);
    setHighlights(evaluations[index].highlights);
  };

  const metrics = Object.keys(ratings);
  const currentMetric = metrics[currentMetricIndex];

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" align="center">
                Individual Human Evaluations
              </Typography>
              <Tooltip
                title={
                  <Typography>
                    Here, can browse all human evaluations across all surveys that have been
                    recorded for this experiment for this summary.
                  </Typography>
                }
              >
                <IconButton>
                  <HelpOutline />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          {evaluations.length > 0 ? (
            <Grid item xs={12}>
              <Paper
                elevation={3}
                variant="outlined"
                sx={{
                  padding: '16px',
                  borderRadius: '20px',
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography
                    variant="h6"
                    sx={{
                      textAlign: 'left',
                    }}
                  >
                    Summary
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>
                      Evaluation {currentEvaluationIndex + 1} of {evaluations.length}
                    </Typography>
                    <IconButton onClick={handlePreviousEvaluation} aria-label="Previous evaluation">
                      <ArrowBack />
                    </IconButton>
                    <IconButton onClick={handleNextEvaluation} aria-label="Next evaluation">
                      <ArrowForward />
                    </IconButton>
                  </Box>
                </Box>
                <SummaryHighlight
                  initialText={summary}
                  index={currentEvaluationIndex}
                  disableHighlighting={true}
                  setHighlightError={setHighlightError}
                  highlights={highlights[currentMetric] || []}
                />
                <Box display="flex" alignItems="center" mt={2}>
                  <Typography
                    gutterBottom
                    sx={{
                      textAlign: 'left',
                      marginRight: '8px',
                      marginBottom: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    Your Highlighting Advice:
                    {evaluations[currentEvaluationIndex]?.highlighting_advice ? (
                      <Typography sx={{ fontStyle: 'italic' }}>
                        {evaluations[currentEvaluationIndex].highlighting_advice}
                      </Typography>
                    ) : (
                      <Typography sx={{ fontStyle: 'italic' }}>N/A</Typography>
                    )}
                  </Typography>
                </Box>
                {highlightError && (
                  <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
                    Some highlights in this summary may not be displayed due to a parsing error.
                  </Alert>
                )}
                <Grid container spacing={2} mt={2}>
                  <Grid item xs={12} className="TextDisplay-slider">
                    <Slider
                      value={ratings[currentMetric] || 0}
                      step={1}
                      marks
                      min={1}
                      max={5}
                      valueLabelDisplay="on"
                      disabled
                      sx={{
                        '&.Mui-disabled': {
                          color: 'primary.main',
                          '& .MuiSlider-thumb': {
                            color: 'primary.main',
                          },
                          '& .MuiSlider-track': {
                            color: 'primary.main',
                          },
                          '& .MuiSlider-rail': {
                            color: 'primary.main',
                          },
                        },
                      }}
                    />
                    <Box display="flex" alignItems="center">
                      <Typography
                        gutterBottom
                        sx={{
                          textAlign: 'left',
                          marginRight: '8px',
                          marginBottom: '4px',
                          fontWeight: 'bold',
                        }}
                      >
                        {currentMetric}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Box mt={2} display="flex" justifyContent="space-between">
                  <TextField
                    label={'Comment'}
                    variant="outlined"
                    value={comment || ''}
                    fullWidth
                    disabled
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" mt={2}>
                  <IconButton onClick={handlePreviousMetric} aria-label="Previous metric">
                    <ArrowBack />
                  </IconButton>
                  <Typography>
                    Metric {currentMetricIndex + 1} of {metrics.length}
                  </Typography>
                  <IconButton onClick={handleNextMetric} aria-label="Next metric">
                    <ArrowForward />
                  </IconButton>
                </Box>
              </Paper>
            </Grid>
          ) : (
            <Typography
              sx={{
                padding: '16px',
                borderRadius: '20px',
              }}
            >
              No evaluations received yet.
            </Typography>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

TextDisplay.propTypes = {
  summary: PropTypes.string.isRequired,
  evaluations: PropTypes.arrayOf(
    PropTypes.shape({
      comment: PropTypes.string,
      ratings: PropTypes.object,
      highlights: PropTypes.arrayOf(
        PropTypes.shape({
          start: PropTypes.number,
          end: PropTypes.number,
          text: PropTypes.string,
          color: PropTypes.string,
          comment: PropTypes.string,
        })
      ),
      highlighting_advice: PropTypes.string,
    })
  ).isRequired,
};

export default TextDisplay;

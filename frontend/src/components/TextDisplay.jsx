import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Collapse,
  Grid,
  IconButton,
  LinearProgress,
  Slider,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  MenuItem
} from '@mui/material';
import { ArrowBack, ArrowForward, InfoOutlined, ExpandLess, ExpandMore } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import SummaryHighlight from './SummaryHighlight';
import './TextDisplay.css';
import PropTypes from 'prop-types';
import axios, { endpoints } from '../utils/axios.js';
import ExpandLessIcon from '@mui/icons-material/ExpandLess.js';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore.js';

const TextDisplay = ({ originalText, summaries: initialSummaries, metrics, index, numberOfArticles, survey }) => {
  TextDisplay.propTypes = {
    originalText: PropTypes.string.isRequired,
    summaries: PropTypes.array.isRequired,
    survey: PropTypes.object.isRequired,
  };

  const [ratings, setRatings] = useState(
    metrics.reduce((acc, metric) => {
      acc[metric.name] = 0; // Set initial value to 0
      return acc;
    }, {})
  );

  const [summaries, setSummaries] = useState(initialSummaries); // Define summaries state
  const [comment, setComment] = useState('');
  const [currentSummaryIndex, setCurrentSummaryIndex] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [numberOfEvaluations, setNumberOfEvaluations] = useState(0);
  const [nonZeroError, setNonZeroError] = useState({});
  const [highlightError, setHighlightError] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [show, setShow] = useState(true);
  const theme = useTheme();
  const [allRatings, setAllRatings] = useState({});
  const [allHighlights, setAllHighlights] = useState({});
  const [highlightComment, setHighlightComment] = useState('');
  const [openHighlightDialog, setOpenHighlightDialog] = useState(false);
  const [highlightData, setHighlightData] = useState({ text: '', start: 0, end: 0 });
  const [highlightColor, setHighlightColor] = useState('yellow');
  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);

  const handleHighlight = (text, start, end) => {
    setHighlightData({ text, start, end });
    setOpenHighlightDialog(true);
  };

  const handleHighlightCommentChange = (event) => {
    setHighlightComment(event.target.value);
  };

  const handleHighlightColorChange = (event) => {
    setHighlightColor(event.target.value);
  };

  const handleHighlightDialogSubmit = () => {
    setHighlights((prevHighlights) => [
      ...prevHighlights,
      {
        ...highlightData,
        comment: highlightComment || '',
        color: highlightColor,
      },
    ]);
    setOpenHighlightDialog(false);
    setHighlightComment('');
    setHighlightColor('yellow');
  };

  const handleHighlightDialogCancel = () => {
    setOpenHighlightDialog(false);
    setHighlightComment('');
    setHighlightColor('yellow');
  };

  useEffect(() => {
    const numberOfEvaluations = summaries.filter((summary) => summary.evaluation !== null).length;
    setNumberOfEvaluations(numberOfEvaluations);
    setEvaluationProgress(Math.round((numberOfEvaluations / summaries.length) * 100));
    resetForm();
  }, [currentSummaryIndex]);

  const { invite_id } = useParams();

  const handleRatingChange = useCallback(
    (category) => (event, newValue) => {
      if (newValue >= 1) {
        setRatings((prevRatings) => ({
          ...prevRatings,
          [category]: newValue,
        }));
        setNonZeroError((prevErrors) => ({
          ...prevErrors,
          [category]: false,
        }));
      }
    },
    []
  );

  const handleCommentChange = (event) => {
    setComment(event.target.value);
  };

  const handleSubmitMetric = () => {
    let cancelSubmit = false;
    const checks = {};
    if (ratings[metrics[currentMetricIndex].name] === 0) {
      checks[metrics[currentMetricIndex].name] = true;
      cancelSubmit = true;
    }
    setNonZeroError(checks);
    if (cancelSubmit) {
      return null;
    }

    const currentMetricName = metrics[currentMetricIndex].name;
    const currentRatings = ratings[currentMetricName];
    const currentHighlights = highlights;

    setAllRatings((prevRatings) => ({
      ...prevRatings,
      [currentMetricName]: currentRatings,
    }));

    setAllHighlights((prevHighlights) => ({
      ...prevHighlights,
      [currentMetricName]: currentHighlights,
    }));

    setCurrentMetricIndex((prevIndex) => (prevIndex + 1) % metrics.length);
    setHighlights([]);

    return { currentRatings, currentHighlights };
  };

  const handleFinalSubmit = () => {
    const lastMetricData = handleSubmitMetric();
    if (!lastMetricData) {
      // If handleSubmitMetric returns null, it means submission was canceled due to errors
      return;
    }

    const evaluationData = {
      ratings: {
        ...allRatings,
        [metrics[currentMetricIndex].name]: lastMetricData.currentRatings,
      },
      highlights: {
        ...allHighlights,
        [metrics[currentMetricIndex].name]: lastMetricData.currentHighlights,
      },
      comment: comment,
    };

    const jsonBody = evaluationData;
    jsonBody.invitation = invite_id;
    jsonBody.summary = summaries[currentSummaryIndex].pk;

    axios
      .post(endpoints.evaluation, jsonBody, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        console.log('Submission successful:', response.data);
        setCurrentMetricIndex(0);
        setDisabled(true); // Disable the nextMetric button after successful submission

        // Update the summaries array with the new evaluation data
        const updatedSummaries = [...summaries];
        updatedSummaries[currentSummaryIndex] = {
          ...updatedSummaries[currentSummaryIndex],
          evaluation: response.data,
        };
        setSummaries(updatedSummaries);
      })
      .catch((error) => {
        console.error('Submission error:', error);
      });
  };

  const handleNextSummary = () => {
    const nextIndex = (currentSummaryIndex + 1) % summaries.length;
    resetForm();
    setCurrentSummaryIndex(nextIndex);
  };

  const handlePreviousSummary = () => {
    const prevIndex = (currentSummaryIndex - 1 + summaries.length) % summaries.length;
    resetForm();
    setCurrentSummaryIndex(prevIndex);
  };

  const resetForm = async () => {
    setRatings(
      metrics.reduce((acc, metric) => {
        acc[metric.name] = 0; // Set initial value to 0
        return acc;
      }, {})
    );
    setNonZeroError({});
    setComment('');
    setDisabled(false);
    setHighlights([]);
    setCurrentMetricIndex(0);
  };

  const toggleTextExpansion = () => {
    setIsTextExpanded(!isTextExpanded);
  };

  const MAX_TEXT_LENGTH = 1200;
  const truncatedText =
    originalText.length > MAX_TEXT_LENGTH
      ? `${originalText.substring(0, MAX_TEXT_LENGTH)}...`
      : originalText;

  const marks = [
    {
      value: 1,
      label: 1,
    },
    {
      value: 2,
      label: 2,
    },
    {
      value: 3,
      label: 3,
    },
    {
      value: 4,
      label: 4,
    },
    {
      value: 5,
      label: 5,
    },
  ];


  const handlePreviousMetric = () => {
    setCurrentMetricIndex((prevIndex) => (prevIndex - 1 + metrics.length) % metrics.length);
  };

  return (
    <Card variant={'outlined'} sx={{ marginBottom: 5 }}>
      <Box
        sx={{
          padding: '16px',
          borderRadius: '20px',
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ marginBottom: 3 }}
        >
          <Typography variant={'h4'}>
            Article {index + 1} of {numberOfArticles}
          </Typography>
          <IconButton onClick={() => setShow(!show)}>
            {show ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        <Box sx={{ width: '100%', mr: 1 }}>
          <LinearProgress variant="determinate" value={evaluationProgress} sx={{ width: '100%' }} />
        </Box>
        <Box sx={{ minWidth: 35 }}>
          <Typography variant="body2" color="text.secondary" sx={{ marginTop: '1%' }}>
            {numberOfEvaluations} of {summaries.length} summaries evaluated for this article
          </Typography>
        </Box>
        <Collapse in={show}>
          <Box sx={{ marginTop: '16px' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card
                  variant={'outlined'}
                  elevation={3}
                  sx={{
                    padding: '16px',
                    borderRadius: '20px',
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      textAlign: 'left',
                    }}
                  >
                    Fulltext Article
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                    onClick={toggleTextExpansion}
                  >
                    {isTextExpanded ? originalText : truncatedText}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card
                  variant={'outlined'}
                  elevation={3}
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
                        Summary {currentSummaryIndex + 1} of {summaries.length}
                      </Typography>
                      <IconButton onClick={handlePreviousSummary} aria-label="Previous summary">
                        <ArrowBack />
                      </IconButton>
                      <IconButton onClick={handleNextSummary} aria-label="Next summary">
                        <ArrowForward />
                      </IconButton>
                    </Box>
                  </Box>
                  <SummaryHighlight
                    initialText={summaries[currentSummaryIndex].summary}
                    onHighlight={handleHighlight}
                    resetHighlights={(e) => setHighlights([])}
                    index={index + '/' + currentSummaryIndex}
                    disableHighlighting={Boolean(summaries[currentSummaryIndex].evaluation)}
                    setHighlightError={setHighlightError}
                    highlights={highlights}
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
                      Administrator's Highlighting Advice:
                      {survey.highlight_question ? (
                        <Typography sx={{ fontStyle: 'italic' }}>
                          {survey.highlight_question}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontStyle: 'italic' }}>N/A</Typography>
                      )}
                    </Typography>
                  </Box>
                  {highlightError && (
                    <Alert severity="warning" sx={{ mt: 1, mb: 1 }}>
                      An error occurred when processing this summary's text highlights.
                    </Alert>
                  )}
                  <Grid container spacing={2} mt={2}>
                    <Grid item xs={12} className="TextDisplay-slider">
                      <Box
                        display="flex"
                        alignItems="center"
                        sx={{
                          color: nonZeroError[metrics[currentMetricIndex].name]
                            ? theme.palette.error.main
                            : theme.palette.text.primary,
                        }}
                      >
                        <Typography
                          gutterBottom
                          sx={{
                            textAlign: 'left',
                            marginRight: '8px',
                            marginBottom: '4px',
                          }}
                        >
                          {metrics[currentMetricIndex].name}
                        </Typography>
                        {metrics[currentMetricIndex].definition && (
                          <Tooltip
                            title={<Typography>{metrics[currentMetricIndex].definition}</Typography>}
                            arrow
                          >
                            <InfoOutlined
                              sx={{
                                fontSize: '18px',
                                marginBottom: '4px',
                              }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Box padding={2}>
                        <Slider
                          value={
                            disabled || (summaries[currentSummaryIndex].evaluation && summaries[currentSummaryIndex].evaluation.ratings)
                              ? summaries[currentSummaryIndex].evaluation?.ratings[metrics[currentMetricIndex].name] || 0
                              : ratings[metrics[currentMetricIndex].name]
                          }
                          onChange={handleRatingChange(metrics[currentMetricIndex].name)}
                          step={1}
                          marks={marks}
                          min={0}
                          max={5}
                          valueLabelDisplay="auto"
                          disabled={summaries[currentSummaryIndex].evaluation !== null}
                        />

                      </Box>
                    </Grid>
                  </Grid>
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handlePreviousMetric}
                      disabled={currentMetricIndex === 0}
                    >
                      Previous Metric
                    </Button>
                    <TextField
                      label={
                        disabled || summaries[currentSummaryIndex].evaluation
                          ? ''
                          : 'Comment (optional)'
                      }
                      variant="outlined"
                      value={comment}
                      onChange={handleCommentChange}
                      fullWidth
                      disabled={Boolean(summaries[currentSummaryIndex].evaluation)}
                      InputLabelProps={{
                        style: {
                          top: '-6px',
                        },
                      }}
                      InputProps={{
                        style: {
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                        },
                      }}
                      sx={{
                        marginRight: 2,
                      }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSubmitMetric}
                      disabled={disabled || currentMetricIndex === metrics.length - 1 || summaries[currentSummaryIndex].evaluation !== null}
                    >
                      Next Metric
                    </Button>
                    {currentMetricIndex === metrics.length - 1 && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFinalSubmit}
                        disabled={disabled || summaries[currentSummaryIndex].evaluation !== null}
                      >
                        Submit All
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Box>
      <Dialog open={openHighlightDialog}>
        <DialogTitle>Add Comment to Highlight</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Add a comment for the highlighted text: "{highlightData.text}"
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Comment (optional)"
            type="text"
            fullWidth
            value={highlightComment}
            onChange={handleHighlightCommentChange}
          />
          <TextField
            select
            label="Highlight Color"
            value={highlightColor}
            onChange={handleHighlightColorChange}
            fullWidth
            margin="dense"
            SelectProps={{
              renderValue: (selected) => {
                if (selected === "green") return "Green";
                if (selected === "red") return "Red";
                if (selected === "yellow") return "Yellow";
                return selected;
              },
            }}
          >
            <MenuItem value="green">
              Green (Sentences align well with the current metric)
            </MenuItem>
            <MenuItem value="red">
              Red (Sentences that do not align with the current metrics and may be incorrect, misleading, or unclear)
            </MenuItem>
            <MenuItem value="yellow">
              Yellow (Sentences highlighted are not contextually appropriate / correct but remain permissible)
            </MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleHighlightDialogCancel} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleHighlightDialogSubmit} color="primary">
            Add Highlight
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default TextDisplay;



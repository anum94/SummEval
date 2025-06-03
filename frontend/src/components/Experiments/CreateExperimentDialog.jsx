import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
  Switch,
  Tooltip,
  LinearProgress
} from '@mui/material';
import React, { useState } from 'react';
import * as Yup from 'yup';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import Papa from 'papaparse';
import axios from '../../utils/axios.js';
import { endpoints } from '../../utils/axios.js';

const metrics = ['bartscore', 'bertscore', 'bleu', 'meteor', 'rouge', 'unieval', 'llm_evaluation', 'factscore'];
const summarizationModels = ['OpenAI - gpt-4o-mini', 'OpenAI - o1', 'Together AI - llama3.1 8B', 'Together AI - llama3.2 3B', 'Together AI - Mistral 7b']
const ownSummaries = ['Yes', 'No']

function DropZone({ onDrop, error }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: '.csv',
    onDrop: onDrop,
    multiple: false,
  });

  return (
    <Box
      sx={{
        height: '200px',
        border: '2px dashed',
        borderColor: error ? 'red' : isDragActive ? 'primary.main' : 'grey.500',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.main',
          '& .MuiSvgIcon-root': {
            color: 'primary.main',
          },
          '& .MuiTypography-root': {
            color: 'primary.main',
          },
        },
      }}
      {...getRootProps()}
      className={isDragActive ? 'drag-active' : ''}
    >
      <input {...getInputProps({ accept: '.csv' })} />{' '}
      <Box>
        <CloudUploadIcon sx={{ fontSize: 52 }} />
      </Box>
      <Typography variant="body" component="div">
        Drag and drop your csv file here, or click to select a file.
      </Typography>
      <Typography variant="body2" component="div" p={2}>
        Please make sure that the file contains one row per full text of the project and the rows
        are in the same order as the full texts shown.
      </Typography>
    </Box>
  );
}

export default function CreateExperimentDialog({ project, fullTexts, handleClose, addExperiment, totalFullTexts, }) {
  const [errorMessage, setErrorMessage] = React.useState('');
  const [csvColumns, setCSVColumns] = React.useState([]);
  const [rowCount, setRowCount] = React.useState(0);

  const [isLoading, setIsLoading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [remainingTime, setRemainingTime] = React.useState('');

  const calculateRemainingTime = (startTime, percentCompleted) => {
    if (startTime) {
      const elapsedTime = (Date.now() - startTime) / 1000; // in seconds
      const estimatedTotalTime = (elapsedTime / percentCompleted) * 100;
      const estimatedRemainingTime = estimatedTotalTime - elapsedTime;
      setRemainingTime(estimatedRemainingTime.toFixed(2));
    }
  };

  // Attributes needed in case of form upload
  const [name, setName] = React.useState('');
  const [llmName, setLLMName] = React.useState('');
  const [prompt, setPrompt] = React.useState('');
  const [contextWindow, setContextWindow] = React.useState();
  const [maxNewTokens, setMaxNewTokens] = React.useState();
  const [summaryColumn, setSummaryColumn] = React.useState('');
  const [promptColumn, setPromptColumn] = React.useState('');
  const [evalMetrics, setEvalMetrics] = React.useState([]);
  const [api_key, setApiKey] = React.useState('');
  const [recordGroups, setRecordGroups] = React.useState([]);
  const [selectedRecordGroup, setSelectedRecordGroup] = React.useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customRanges, setCustomRanges] = useState([]);
  const [startIndex, setStartIndex] = useState('');
  const [endIndex, setEndIndex] = useState('');

  const handleModeToggle = (event) => {
    setIsCustomMode(event.target.checked);
    setCustomRanges([]); // Reset ranges when switching modes
  };

  const addCustomRange = () => {
    if (!startIndex && !endIndex) {
      setErrorMessage('Please provide a start or end index.');
      return;
    }

    const start = parseInt(startIndex, 10) || parseInt(endIndex, 10);
    const end = parseInt(endIndex, 10) || parseInt(startIndex, 10);

    if (start > end) {
      setErrorMessage('Start index cannot be greater than end index.');
      return;
    }

    // Check for overlaps
    const newRangeIndices = new Set(
      Array.from({ length: end - start + 1 }, (_, i) => start + i)
    );

    for (const range of customRanges) {
      const existingRangeIndices = new Set(
        Array.from({ length: range.end - range.start + 1 }, (_, i) => range.start + i)
      );
      const overlap = [...newRangeIndices].some((index) => existingRangeIndices.has(index));
      if (overlap) {
        setErrorMessage('The new range overlaps with an existing range.');
        return;
      }
    }

    // Add the new range
    setCustomRanges([...customRanges, { start, end }]);
    setStartIndex('');
    setEndIndex('');
    setErrorMessage('');
  };


  const removeCustomRange = (index) => {
    setCustomRanges(customRanges.filter((_, i) => i !== index));
  };

  React.useEffect(() => {
    if (totalFullTexts > 0) {
      const groups = [];
      for (let i = 1; i <= totalFullTexts; i += 100) {
        const end = Math.min(i + 99, totalFullTexts);
        groups.push(`${i} - ${end}`);
      }
      setRecordGroups(groups);
    }
  }, [totalFullTexts]);

  const [summarizationModel, setSummarizationModel] = React.useState('');

  const [attributeErrors, setAttributeErrors] = React.useState({});

  // Attributes needed in case of csv upload
  const [selectedCSVFile, setSelectedCSVFile] = React.useState([]);

  const closeAndSuccess = async () => {
    resetErrors();
    handleClose();
  };

  const resetErrors = async () => {
    setErrorMessage('');
    setAttributeErrors({});
  };

  const createExperiment = async () => {
    try {
      setIsLoading(true);
      setUploadProgress(0);
      const startTime = Date.now();
      const data = new FormData();

      // Add ranges if custom mode is enabled
      if (isCustomMode) {
        const ranges = customRanges.map(range => ({
          start: range.start,
          end: range.end
        }));
        data.append('custom_ranges', JSON.stringify(ranges));
        data.append('fixed_range', 'false');
      } else {
        const [start, end] = selectedRecordGroup.split(' - ').map(Number);
        data.append('start_record', start);
        data.append('end_record', end);
        data.append('fixed_range', 'true');
      }

      // Other data fields
      data.append('project', project.pk);
      data.append('name', name);
      data.append('llm_name', llmName);
      data.append('prompt', prompt || "");
      data.append('summary_column', summaryColumn);
      data.append('prompt_column', promptColumn);

      data.append('context_window', contextWindow == null || contextWindow === undefined || isNaN(contextWindow) ? 0 : contextWindow);
      data.append('max_new_tokens', maxNewTokens == null || maxNewTokens == undefined || isNaN(maxNewTokens) ? 0 : maxNewTokens);
      data.append('csv_file', selectedCSVFile[0]);
      data.append('eval_metrics', evalMetrics);
      data.append('api_key', api_key);
      data.append('summarization_model', summarizationModel);

      axios
        .post(endpoints.experiments.default, data, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
            calculateRemainingTime(startTime, percentCompleted);
          }
        })
        .then((response) => {
          setIsLoading(false);
          setUploadProgress(100);
          setRemainingTime('');
          if (!response.status === 201) {
            setErrorMessage(response.data.error);
          } else {
            const newExperiment = response.data;
            addExperiment({ experiment: newExperiment[0] });
            closeAndSuccess();
          }
        })
        .catch((error) => {
          setIsLoading(false);
          setUploadProgress(0);
          setRemainingTime('');
          console.error('Error creating experiment:', error);
          const errorMessage =
            typeof error === 'string'
              ? error
              : error?.error || 'An unexpected error occurred. Please try again later.';

          if (errorMessage === 'CSV rows do not match project FullText count.') {
            setErrorMessage(
              'The number of rows in the uploaded CSV file does not match the expected number of full texts in the project. ' +
              'Please ensure the CSV file includes one row per full text, and the rows are in the same order as the project’s full texts.'
            );
          } else if (errorMessage === 'Missing required attributes.') {
            setErrorMessage(
              'Required attributes are missing. Please provide all necessary fields and try again.'
            );
          } else {
            setErrorMessage(errorMessage);
          }
        });


    } catch (errors) {
      if (errors.inner) {
        const newErrors = {};
        errors.inner.forEach((err) => {
          newErrors[`${err.path}Error`] = true;
        });
        setAttributeErrors((prevErrors) => ({ ...prevErrors, ...newErrors }));
        console.log(newErrors);
        setErrorMessage('Please fill all required fields.');
      }
    }
  };

  // Success animation:
  /*
  <Box sx={{ display: "flex" }}>
    <Zoom in={success} {...{ timeout: 500 }}>
      <CheckCircleOutlineIcon sx={{ fontSize: 100, color: "green" }} />
    </Zoom>
  </Box>
   */

  return (
    <Dialog open>
      <DialogTitle>Upload New Experiment</DialogTitle>

      <DialogContent >

        <Grid container spacing={2} sx={{ marginTop: '1%' }}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              value={name}
              required
              error={attributeErrors.nameError}
              onChange={(e) => setName(e.target.value)}
              onFocus={resetErrors}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <DropZone
              onDrop={(e) => {
                setSelectedCSVFile(e);
                console.log(e[0]);
                const reader = new FileReader();
                const parseCSVHeaders = (csvText) => {
                  const lines = csvText.split('\n');
                  if (lines.length > 0) {
                    const headerLine = lines[0];
                    return headerLine.split(',').map((header) => header.trim());
                  }
                  return [];
                };
                reader.onload = (event) => {
                  const text = event.target.result;
                  const headers = parseCSVHeaders(text);
                  console.log(headers);
                  setCSVColumns(headers);

                  //const lines = text.split("\n");
                  //const rowCount = lines.filter(line => line.trim() !== '').length - 1;
                  const result = Papa.parse(text, { skipEmptyLines: true });
                  const rowCount = result.data.length - 1;
                  setRowCount(rowCount);
                };
                reader.readAsText(e[0]);
              }}
              error={attributeErrors.selectedCSVFileError}
            />
          </Grid>


          <Grid item xs={12}>
            <Typography
              color={
                attributeErrors.rowCountError || attributeErrors.selectedCSVFileError
                  ? 'red'
                  : 'black'
              }
            >
              {selectedCSVFile[0] ? selectedCSVFile[0].name : ''}
              {attributeErrors.selectedCSVFileError
                ? ''
                : attributeErrors.rowCountError
                  ? ` (Got ${rowCount} rows but expected ${fullTexts.length})`
                  : ''}
            </Typography>
          </Grid>



          {/* Mode Toggle */}
          <Grid item xs={12} display="flex" alignItems="center">
            <Typography>
              {isCustomMode ? 'Custom Index Mode' : 'Fixed Index Range Mode'}
            </Typography>
            <Tooltip title="Switch between using predefined index ranges and customizing your selection.">
              <Switch
                checked={isCustomMode}
                onChange={handleModeToggle}
                inputProps={{ 'aria-label': 'Toggle between fixed and custom modes' }}
                sx={{ marginLeft: 2 }}
              />
            </Tooltip>
          </Grid>

          {isCustomMode ? (
            <>
              {/* Custom Mode Inputs */}
              <Grid item xs={6}>
                <TextField
                  label="Start Index"
                  type="number"
                  value={startIndex}
                  onChange={(e) => setStartIndex(e.target.value)}
                  onFocus={resetErrors}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="End Index"
                  type="number"
                  value={endIndex}
                  onChange={(e) => setEndIndex(e.target.value)}
                  onFocus={resetErrors}
                  fullWidth
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant="outlined" onClick={addCustomRange} fullWidth>
                  Add Custom Range
                </Button>
              </Grid>


              <Grid item xs={12}>
                {customRanges.length > 0 && (
                  <>
                    <Typography>Selected Ranges:</Typography>
                    <Box>
                      {customRanges.map((range, index) => (
                        <Chip
                          key={index}
                          label={
                            range.start === range.end
                              ? `${range.start}`
                              : `${range.start}-${range.end}`
                          }
                          onDelete={() => removeCustomRange(index)}
                          sx={{ margin: '4px' }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Grid>
            </>
          ) : (
            // Fixed Mode Selection
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="choose-select-record-label">
                  Select Record Group
                </InputLabel>

                <Select
                  labelId="choose-select-record-label"
                  id="choose-record-label-select"
                  label="Select Record Group"
                  value={selectedRecordGroup}
                  onChange={(e) => setSelectedRecordGroup(e.target.value)}
                  onFocus={resetErrors}
                >
                  {recordGroups.map((group, index) => (
                    <MenuItem key={index} value={group}>
                      {group}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}



          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="choose-prompt-column-select-label" required>
                Column containing the prompt
              </InputLabel>

              <Select
                labelId="choose-prompt-column-select-label"
                id="choose-prompt-column-select"
                value={promptColumn}
                label="Column containing the prompt"
                required
                onChange={(e) => setPromptColumn(e.target.value)}
                onFocus={resetErrors}
              >

                <MenuItem
                  value={'Specify prompt via text form.'}
                  sx={{
                    fontWeight: 'bold',
                  }}
                >
                  Specify prompt via text form.
                </MenuItem>

                {csvColumns.map((column, index) => (
                  <MenuItem key={index} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {promptColumn === 'Specify prompt via text form.' && (
            <Grid item xs={12}>
              <TextField
                label="Prompt"
                value={prompt}
                onChange={(e) => {
                  console.log(e.target.value); // Logs the value to the console
                  setPrompt(e.target.value);   // Updates the prompt state
                }}
                onFocus={resetErrors}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <FormControl fullWidth>

              <InputLabel id="choose-summary-column-select-label" required>
                Column containing the summary
              </InputLabel>

              <Select
                labelId="choose-summary-column-select-label"
                id="choose-summary-column-select"
                value={summaryColumn}
                label="Column containing the summary"
                onChange={(e) => setSummaryColumn(e.target.value)}
                onFocus={resetErrors}
              >
                {csvColumns.map((column, index) => (
                  <MenuItem key={index} value={column}>
                    {column}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>



          {(prompt || promptColumn) && summaryColumn && (

            <>
              <Grid item xs={12}>
                <TextField
                  label="LLM Name"
                  value={llmName}
                  onFocus={resetErrors}
                  onChange={(e) => setLLMName(e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Context Window"
                  value={contextWindow}
                  onFocus={resetErrors}
                  onChange={(e) => {

                    const value = e.target.value;
                    console.log("Type of context window: ", typeof (value));
                    if (value === "") {
                      console.log("The context window value is empty", value);
                      setContextWindow(null);
                    }
                    else if (!isNaN(value) && value > 0) {
                      console.log("The context window value type is not NAN and bigger than 0: ", value);
                      setContextWindow(parseInt(value)); // Set 0 if empty, else set the parsed value
                    }
                  }}

                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  type="number"
                  label="Max New Tokens"
                  value={maxNewTokens}
                  onFocus={resetErrors}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "") {
                      console.log("The maxNewTokens value is empty", value);
                      setMaxNewTokens(null);
                    }

                    else if (!isNaN(value) && value > 0) {
                      console.log("The maxNewTokensvalue type is not NAN and bigger than 0: ", value);
                      setMaxNewTokens(parseInt(value));
                    }
                  }}

                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="choose-eval-metrics-select-label">
                    Which scores do you want to have calculated?
                  </InputLabel>
                  <Select
                    labelId="choose-eval-metrics-select-label"
                    id="choose-eval-metrics-select"
                    value={evalMetrics}
                    label="Which scores do you want to have calculated?"
                    onChange={(e) => {
                      const {
                        target: { value },
                      } = e;
                      setEvalMetrics(
                        typeof value === 'string' ? value.split(',') : value
                      );
                    }}
                    onFocus={resetErrors}

                    renderValue={(selected) =>
                      selected && selected.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} />
                          ))}
                        </Box>
                      ) : (
                        "Select metrics"
                      )
                    }
                    multiple
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 48 * 4.5 + 8,
                          width: 250,
                        },
                      },
                    }}
                  >
                    {metrics.map((metric) => (
                      <MenuItem key={metric} value={metric}>
                        {metric}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          {evalMetrics.includes('llm_evaluation') && (
            <Grid item xs={12}>
              <TextField
                label="API Key for LLM Evaluation Service"
                value={api_key}
                onChange={(e) => setApiKey(e.target.value)}
                fullWidth
                required
              />
            </Grid>
          )}
        </Grid>

      </DialogContent>
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      <Grid item xs={12}>
        {isLoading && (
          <Box sx={{ marginBottom: 2, marginLeft: 2, marginRight: 2 }}>
            <Typography>Creating Experiment: {`${uploadProgress}%`}</Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="textSecondary">
              Estimated remaining time: {remainingTime} seconds
            </Typography>
          </Box>
        )}
      </Grid>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        {isLoading ? (
          <Button variant="contained" disabled>
            Creating Experiment...
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => {
              if (!name || !(prompt || promptColumn) || !summaryColumn) {
                setAttributeErrors({ nameError: true });
                return;  // Prevent form submission if name is empty
              }
              createExperiment();
            }}
            disabled={!name || !(prompt || promptColumn) || !summaryColumn}  // Disable the button if name is empty
          >
            Create Experiment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

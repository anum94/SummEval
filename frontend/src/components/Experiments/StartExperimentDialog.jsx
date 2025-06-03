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
  Select,
  TextField,
  Typography,
  Tooltip,
  Switch,
  LinearProgress

} from '@mui/material';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios from '../../utils/axios.js';
import { endpoints } from '../../utils/axios.js';

const metrics = ['bartscore', 'bertscore', 'bleu', 'meteor', 'rouge', 'unieval', 'llm_evaluation', 'factscore'];
const summarizationModels = ['OpenAI - gpt-4o-mini', 'OpenAI - o1-mini', 'OpenAI - o1-preview', 'Together AI - llama3.1 8B', 'Together AI - llama3.2 3B', 'Together AI - Mistral 7b']

function DropZone({ onDrop, error }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: '.txt', // Accept only .txt files
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
      <input {...getInputProps({ accept: '.txt' })} /> {/* Accept .txt files */}
      <Box>
        <CloudUploadIcon sx={{ fontSize: 52 }} />
      </Box>
      <Typography variant="body" component="div">
        Drag and drop your .txt file here, or click to select a file.
      </Typography>
      <Typography variant="body2" component="div" p={2}>
        Please make sure that the file is a plain text file containing your desired content.
      </Typography>
    </Box>
  );
}


export default function StartExperimentDialog({ project, fullTexts, handleClose, addExperiment, totalFullTexts, apiLinkRequired }) {
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

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
  const [summarizationModel, setSummarizationModel] = React.useState('');
  const [apiLink, setApiLink] = React.useState('');
  const [isCustomMode, setIsCustomMode] = React.useState(false);
  const [recordGroups, setRecordGroups] = React.useState([]);
  const [selectedRecordGroup, setSelectedRecordGroup] = React.useState('');
  const [customRanges, setCustomRanges] = React.useState([]);
  const [startIndex, setStartIndex] = React.useState('');
  const [endIndex, setEndIndex] = React.useState('');
  const [overallProgress, setOverallProgress] = React.useState(0);


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

  const handleModeToggle = (event) => {
    setIsCustomMode(event.target.checked);
    setCustomRanges([]);
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

    setCustomRanges([...customRanges, { start, end }]);
    setStartIndex('');
    setEndIndex('');
    setErrorMessage('');
  };


  const createExperiment = async () => {
    try {
      setIsLoading(true);
      const data = new FormData();
      data.append('project', project.pk);
      data.append('name', name);
      data.append('llm_name', llmName);
      data.append('prompt', prompt); // append empty if none is given via text field
      data.append('summary_column', summaryColumn);
      data.append('prompt_column', promptColumn);
      data.append('context_window', contextWindow == null || contextWindow === undefined || isNaN(contextWindow) ? 16384 : contextWindow);
      data.append('max_new_tokens', maxNewTokens == null || maxNewTokens == undefined || isNaN(maxNewTokens) ? 256 : maxNewTokens);
      data.append('csv_file', selectedCSVFile[0]); // It is guaranteed that there is only 1 file stored in the array
      data.append('eval_metrics', evalMetrics);
      data.append('api_key', api_key);

      if (apiLinkRequired) {
        data.append('api_link', apiLink);
      } else {
        data.append('summarization_model', summarizationModel);
        data.append('use_model', 'true');
      }

      if (isCustomMode) {
        // Pass custom ranges
        if (customRanges.length === 0) {
          setErrorMessage('Please add at least one custom range.');
          return;
        }
        data.append('fixed_range', 'false');
        data.append('custom_ranges', JSON.stringify(customRanges));
      } else {
        // Pass fixed range
        if (!selectedRecordGroup) {
          setErrorMessage('Please select a record group.');
          return;
        }
        const [start, end] = selectedRecordGroup.split(' - ').map(Number);
        data.append('fixed_range', 'true');
        data.append('start_record', start);
        data.append('end_record', end);
      }

      setIsLoading(true);
      setOverallProgress(10);

      const interval = setInterval(() => {
        setOverallProgress((oldProgress) => {
          if (oldProgress >= 90) return oldProgress; // Stop at 90% until request finishes
          return oldProgress + 10; // Increment slowly
        });
      }, 500);

      axios.post(endpoints.experiments.default, data)
        .then((response) => {
          setIsLoading(false);
          setTimeout(() => setOverallProgress(100), 500);
          clearInterval(interval);

          if (response.status !== 201) {
            setErrorMessage(response.data.error);
          } else {
            const newExperiment = response.data;
            addExperiment({ experiment: newExperiment[0] });
            closeAndSuccess();
          }
        })
        .catch((error) => {
          clearInterval(interval);
          setIsLoading(false);
          setOverallProgress(0);
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
  return (
    <Dialog open>
      <DialogTitle>Start New Experiment</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ marginTop: '1%' }}>
          <Grid item xs={12}>
            <TextField
              label="Name"
              value={name}
              required
              error={attributeErrors.nameError}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
          </Grid>
          {/* Mode Toggle */}
          <Grid item xs={12} display="flex" alignItems="center">
            <Typography>
              {isCustomMode ? 'Custom Index Mode' : 'Fixed Index Range Mode'}
            </Typography>
            <Tooltip title="Switch between fixed range and custom index selection">
              <Switch checked={isCustomMode} onChange={handleModeToggle} />
            </Tooltip>
          </Grid>

          {isCustomMode ? (
            <>
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
                Prompt specification
              </InputLabel>

              <Select
                labelId="choose-prompt-column-select-label"
                id="choose-prompt-column-select"
                value={promptColumn}
                onFocus={resetErrors}
                label="Prompt specification"
                required
                onChange={(e) => setPromptColumn(e.target.value)}
              >
                <MenuItem
                  value={'Upload txt file which includes the prompt.'}
                  sx={{
                    fontWeight: 'bold',

                  }}
                >
                  Upload txt file which includes the prompt.
                </MenuItem>

                <MenuItem
                  value={'Specify prompt via text form.'}
                  sx={{
                    fontWeight: 'bold',

                  }}
                >
                  Specify prompt via text form.
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {promptColumn === 'Specify prompt via text form.' && (
            <Grid item xs={12}>
              <TextField
                label="Prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={resetErrors}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          )}

          {promptColumn === 'Upload txt file which includes the prompt.' && (
            <Grid item xs={12}>
              <DropZone
                onDrop={(e) => {
                  const file = e[0];
                  if (!file.name.endsWith('.txt')) {
                    console.error("Invalid file type. Please upload a .txt file.");
                    return;
                  }

                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target.result; // Get the file content
                    console.log("File content:", text); // Debugging: Print the file content
                    setPrompt(text); // Set the file content as the prompt
                  };
                  reader.onerror = () => {
                    console.error("Failed to read the file.");
                  };

                  reader.readAsText(file); // Read the content of the .txt file
                }}

              />
            </Grid>
          )}

          <Grid container item xs={12} >
            {apiLinkRequired ? (
              <>
                <Tooltip title="Ensure the custom model deployed can accept and process the 'prompt' attribute sent in the request." >
                  <TextField
                    label="API Endpoint"

                    value={apiLink}
                    required
                    onChange={(e) => setApiLink(e.target.value)}
                    onFocus={resetErrors}
                    fullWidth
                    sx={{ marginBottom: '10px ' }}
                  />
                </Tooltip>
                <Grid item xs={12}>
                  <TextField
                    label="LLM Name"
                    value={llmName}
                    onChange={(e) => setLLMName(e.target.value)}
                    onFocus={resetErrors}
                    fullWidth

                  />
                </Grid>
              </>
            ) : (
              <FormControl fullWidth>

                <InputLabel id="choose-summarization-model-select-label" required>
                  Which summarization model do you want to choose?
                </InputLabel>

                <Select
                  labelId="choose-summarization-model-select-label"
                  id="choose-summarization-model-select"
                  value={summarizationModel}
                  label="Which summarization model do you want to choose?"
                  required
                  onChange={(e) => {
                    setSummarizationModel(e.target.value);  // Set the selected model
                    setLLMName(e.target.value);              // Set llmName to the selected model
                  }}
                  onFocus={resetErrors}
                >
                  {summarizationModels.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Grid>


          {(prompt || promptColumn) && (summarizationModel || apiLink) && (
            <>

              <Grid item xs={6}>

                <TextField
                  type="number"
                  label="Context Window"
                  placeholder="(Default: 16384)"
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
                  placeholder="(Default: 256)"
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
                  <InputLabel id="choose-eval-metrics-label">
                    Which scores do you want to have calculated?
                  </InputLabel>
                  <Select
                    labelId="choose-eval-metrics-label"
                    id="choose-eval-metrics"
                    label="Which scores do you want to have calculated?"
                    value={evalMetrics}
                    onChange={(e) => {
                      const {
                        target: { value },
                      } = e;
                      setEvalMetrics(
                        // On autofill we get a stringified value.
                        typeof value === 'string' ? value.split(',') : value
                      );
                    }}

                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                    multiple
                  >
                    {metrics.map((metric) => (
                      <MenuItem key={metric} value={metric}>
                        {metric}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>)}
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
            <Typography>Creating Experiment: {`${overallProgress}%`}</Typography>
            <LinearProgress variant="determinate" value={overallProgress} />
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
              if (!name || !(prompt || promptColumn) || !(summarizationModel || apiLink)) {
                setAttributeErrors({ nameError: true });
                return;  // Prevent form submission if name is empty
              }

              // Proceed with experiment creation logic, e.g., simulate upload progress
              createExperiment();
            }}
            disabled={!name || !(prompt || promptColumn) || !(summarizationModel || apiLink)}  // Disable the button if name is empty
          >
            Create Experiment
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
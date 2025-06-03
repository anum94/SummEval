import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useContext } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import LoadingButton from '@mui/lab/LoadingButton';
import Papa from "papaparse";
import LinearProgress from '@mui/material/LinearProgress';
import {
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Button,
  DialogActions,
  Alert,
  Box,
  Typography,
  MenuItem,
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import * as Yup from 'yup';
import { Form, Field } from '../../components//Hook-Form';
import axios, { endpoints } from '../../utils/axios.js';
import { ProjectsContext } from '../../ProjectsProvider.jsx';
const _tags = [
  'Research',
  'Industry',
  'Health',
  'Finance',
  'Technology',
  'Education',
  'Agriculture',
  'Environment',
];

function DropZone({ onDrop }) {
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
        borderColor: isDragActive ? 'primary.main' : 'grey.500',
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
      <Typography variant="body2" component="div">
        Drag and drop your csv file here, or click to select a file.
      </Typography>
    </Box>
  );
}

export default function CreateProjectDialog({ handleClose, addProject }) {
  const [errorMessage, setErrorMessage] = React.useState('');
  const [uploadingErrorMessage, setUploadingErrorMessage] = React.useState('');
  const [attributeErrors, setAttributeErrors] = React.useState({});
  const [selectedCSVFile, setSelectedCSVFile] = React.useState([]);
  const [csvColumns, setCSVColumns] = React.useState([]);
  const [progress, setProgress] = React.useState(0); // Progress state
  const [viewProgress, setViewProgress] = React.useState(false); // Progress state
  const [project, setProject] = React.useState({});
  const [canceled, setCanceled] = React.useState(false)
  const abortControllerRef = React.useRef(new AbortController()); // Persistent AbortController

  const { fetchProjects } = useContext(ProjectsContext); // Access refreshProjects from context

  const handleRefresh = () => {
    console.log("Refresh project is called in project details");

    fetchProjects(); // Call the function to trigger a refresh
  };
  const projectSchema = Yup.object().shape({
    name: Yup.string().required('Name is required.'),
    description: Yup.string(),
    tags: Yup.array(),
    csv_file: Yup.array().required('CSV file is required.'),
    full_text_column: Yup.string().required('Full text column is required.'),
    reference_summary_column: Yup.string().required('Reference summary column is required.'),
  });

  const methods = useForm({
    resolver: yupResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      csv_file: [],
      tags: [],
      full_text_column: '',
      reference_summary_column: '',
    },
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const resetErrors = () => {
    setErrorMessage('');
    setAttributeErrors({});
  };

  const closeAndSuccess = async () => {
    resetErrors();
    handleClose();
  };
  const splitByRows = (rows, rowsPerChunk) => {
    const chunks = [];
    const header = rows[0];

    for (let i = 1; i < rows.length; i += rowsPerChunk) {
      const chunk = rows.slice(i, i + rowsPerChunk); // Skip the header in slicing
      chunks.push([header, ...chunk]); // Add the header to each chunk
    }
    return chunks;
  };

  const abort = async () => {
    abortControllerRef.current.abort();
    console.log("abort", project.pk)
    axios.delete(`${endpoints.projects}?pk=${project.pk}`);
  };

  const handleCancel = async () => {
    setCanceled(true)
    abort();
    handleClose();
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const file = data.csv_file[0]; // The selected file

      if (!file) {
        alert("Please upload a CSV file first!");
        return;
      }
      const rowsPerChunk = 10; // Adjust the number of rows per chunk as needed

      const parseFile = () =>
        new Promise((resolve, reject) => {
          Papa.parse(file, {
            complete: (result) => {
              const rows = result.data;
              const chunks = splitByRows(rows, rowsPerChunk);
              const csvFiles = chunks.map((chunk, index) => {
                return {
                  filename: `chunk_${index + 1}.csv`,
                  content: Papa.unparse(chunk), // Convert chunk back to CSV string
                };
              });
              resolve(csvFiles);
            },
            error: (error) => reject(error),
          });
        });

      const csvFiles = await parseFile();
      const signal = abortControllerRef.current.signal;
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('tags', data.tags);
      const response = await axios.post(endpoints.projects, formData, { signal });

      if (response.status >= 400) {
        setErrorMessage((await response.data).error);
      } else {
        const newProject = await response.data;
        setProject(newProject[0]);
        console.log("project1", newProject[0].pk)

        let uploadedChunks = 0;
        setViewProgress(true)

        const promises = csvFiles.map(async (csvFile, index) => {
          const blob = new Blob([csvFile.content], { type: 'text/csv' });
          const file = new File([blob], csvFile.filename, { type: 'text/csv' });
          const formData2 = new FormData();
          formData2.append('csv_file', file);
          formData2.append('project', newProject[0].pk);
          formData2.append('full_text_column', data.full_text_column);
          formData2.append('reference_summary_column', data.reference_summary_column);
          formData2.append('chunk_index', index)
          formData2.append('chunk_size', rowsPerChunk)
          const retries = 3;
          let response2;

          let r = 0
          for (; r < retries; r += 1) {
            try {
              if (canceled) {
                console.log("canceled")
                return;
              }
              console.log(`Uploading ${csvFile.filename}, attempt ${r + 1}`);
              response2 = await axios.post(endpoints.fulltexts, formData2, { signal });

              if (response2.status === 201) {
                console.log(`Successfully uploaded ${csvFile.filename}`);
                uploadedChunks = uploadedChunks + 1;
                const progress = (uploadedChunks / csvFiles.length) * 100;
                setProgress(progress);
                return response2; // Return the successful response
              } else {
                console.error(`Error uploading ${csvFile.filename}: ${response2.status}`);
                throw new Error(`Failed with status ${response2.status}`);

              }
            } catch (error) {
              console.error(`Error uploading ${csvFile.filename} (attempt ${r + 1}):`, error);
              if (r === retries - 1) {
                throw new Error(error.error);
              }
            }
          }
        });
        // Wait for all promises to complete
        await Promise.all(promises);
        addProject(newProject[0]);
        handleRefresh();
        closeAndSuccess();
      }
    } catch (error) {
      console.error(error.message);
      setErrorMessage(error.message || "An unexpected error occurred during upload.");
      abort();
    }
  });

  return (
    <div>
      <Dialog open>
        <DialogTitle>Create New Project</DialogTitle>
        <Form methods={methods} onSubmit={onSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ marginTop: '1%' }}>
              <Grid item xs={12}>
                <Field.Text name="name" label="Project name" />
              </Grid>
              <Grid item xs={12}>
                <Field.Text name="description" label="Description" />
              </Grid>
              <Grid item xs={12}>
                <Field.Autocomplete
                  name="tags"
                  label="Tags"
                  placeholder="+ Tags"
                  multiple
                  freeSolo
                  disableCloseOnSelect
                  options={_tags.map((option) => option)}
                  getOptionLabel={(option) => option}
                  renderOption={(props, option) => (
                    <li {...props} key={option}>
                      {option}
                    </li>
                  )}
                  renderTags={(selected, getTagProps) =>
                    selected.map((option, index) => (
                      <Chip
                        {...getTagProps({ index })}
                        key={option}
                        label={option}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                    ))
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <DropZone
                  onDrop={(e) => {
                    setSelectedCSVFile(e);
                    setValue('csv_file', e);
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
                      setCSVColumns(headers);
                    };
                    reader.readAsText(e[0]);
                  }}
                  error={attributeErrors.selectedCSVFileError}
                />
                <Grid item xs={12} sx={{ marginTop: 2 }}>
                  <Typography>{selectedCSVFile[0] ? selectedCSVFile[0].name : ''}</Typography>
                </Grid>
                <Grid item xs={12}>
                  {viewProgress && (
                    <Box sx={{ marginBottom: 2, marginTop: 2, marginLeft: 2, marginRight: 2 }}>
                      <Typography>Uploading File: {Math.round(progress)}%</Typography>
                      <LinearProgress variant="determinate" value={progress} />
                    </Box>
                  )}
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Field.Select
                  fullWidth
                  name="full_text_column"
                  label="Column containing the full texts"
                  InputLabelProps={{ shrink: true }}
                >
                  {csvColumns.map((option) => (
                    <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
                      {option}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
              <Grid item xs={12}>
                <Field.Select
                  fullWidth
                  name="reference_summary_column"
                  label="Column containing the reference summaries"
                  InputLabelProps={{ shrink: true }}
                >
                  <MenuItem
                    value={'Proceed without prompt.'}
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    Proceed without reference summary.
                  </MenuItem>
                  {csvColumns.map((option) => (
                    <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
                      {option}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
            </Grid>
          </DialogContent>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <DialogActions>
            <Button onClick={handleCancel}>Cancel</Button>
            <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
              Create Project
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>
    </div>
  );
}

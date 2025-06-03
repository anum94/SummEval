import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import * as React from 'react';
import * as Yup from 'yup';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import axios, { endpoints } from '../utils/axios.js';

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

export default function AddFullTextDialog({ projectId, handleClose }) {
  const [errorMessage, setErrorMessage] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const [csvColumns, setCSVColumns] = React.useState([]);

  // Attributes needed in case of form upload
  const [name, setName] = React.useState('');
  const [llmName, setLLMName] = React.useState('');
  const [fullTextColumn, setFullTextColumn] = React.useState('');
  const [referenceSummaryColumn, setReferenceSummaryColumn] = React.useState('');

  const fullTextSchema = Yup.object().shape({
    selectedCSVFile: Yup.array().min(1, 'selectedCSVFileError'),
  });

  const [attributeErrors, setAttributeErrors] = React.useState({});

  // Attributes needed in case of csv upload
  const [selectedCSVFile, setSelectedCSVFile] = React.useState([]);

  const closeAndSuccess = () => {
    handleClose();
    /*
    Success animation:
    setSuccess(!success);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
    }, 1500); // Duration (in ms) for which the icon stays visible (1000ms stay + 1000ms grow-out)}
       */
  };

  const resetErrors = () => {
    setErrorMessage('');
    setAttributeErrors({});
  };

  const createFullText = async () => {
    try {
      // Validate the data
      resetErrors();
      await fullTextSchema.validate(
        {
          name,
          llmName,
        },
        { abortEarly: false }
      );
      const data = new FormData();
      data.append('project', projectId);
      data.append('full_text_column', fullTextColumn);
      data.append('reference_summary_column', referenceSummaryColumn);
      data.append('csv_file', selectedCSVFile[0]); // It is guaranteed that there is only 1 file stored in the array
      axios
        .patch(endpoints.invitation, data, {
          headers: {
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          // Handle successful response if needed
          setErrorMessage(response.data);
        })
        .catch((error) => {
          console.error('Error:', error);
          closeAndSuccess();
        });
    } catch (errors) {
      if (errors.inner) {
        const newErrors = {};
        errors.inner.forEach((err) => {
          newErrors[`${err.path}Error`] = true;
        });
        setAttributeErrors((prevErrors) => ({ ...prevErrors, ...newErrors }));
        setErrorMessage('Please fill all required fields.');
      }
    }
  };

  return (
    <div>
      <Dialog open>
        <DialogTitle>Add a New Full Text</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
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
                  };
                  reader.readAsText(e[0]);
                }}
                error={attributeErrors.selectedCSVFileError}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography>{selectedCSVFile[0] ? selectedCSVFile[0].name : ''}</Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="choose-fulltext-column-select-label" required>
                  Column containing the full text
                </InputLabel>
                <Select
                  labelId="choose-fulltext-column-select-label"
                  id="choose-fulltext-column-select"
                  value={fullTextColumn}
                  label="Column containing the full text"
                  onChange={(e) => setFullTextColumn(e.target.value)}
                >
                  {csvColumns.map((column, index) => (
                    <MenuItem key={index} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="choose-reference-summary-column-select-label">
                  Column containing the reference summary
                </InputLabel>
                <Select
                  labelId="choose-reference-summary-column-select-label"
                  id="choose-reference-summary-column-select"
                  value={referenceSummaryColumn}
                  label="Column containing the reference summary"
                  onChange={(e) => setReferenceSummaryColumn(e.target.value)}
                >
                  <MenuItem
                    value={'Proceed without prompt.'}
                    sx={{
                      fontWeight: 'bold',
                    }}
                  >
                    Proceed without reference summary.
                  </MenuItem>
                  {csvColumns.map((column, index) => (
                    <MenuItem key={index} value={column}>
                      {column}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={createFullText}>
            Add full text
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

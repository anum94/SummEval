import React, { useState } from 'react';
import {
  Slide,
  Box,
  Button,
  FormLabel,
  FormControlLabel,
  Radio,
  FormControl,
  RadioGroup,
  Grid,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios, { endpoints } from '../../utils/axios.js';

export default function EvaluatorData({ open, onClose, invitationId }) {
  const [role, setRole] = useState('');
  const [background, setBackground] = useState('');
  const [highestDegree, setHighestDegree] = useState('');
  const [nlpExperience, setNlpExperience] = useState('');

  const handleSubmit = async () => {
    const body = {
      invitation: invitationId,
      patch_body: {
        role: role,
        background: background,
        highest_degree: highestDegree,
        nlp_experience: nlpExperience,
        ask_for_personal_data: false,
      },
    };
    axios
      .patch(endpoints.invitation, body, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then((response) => {
        // Handle successful response if needed
      })
      .catch((error) => {
        console.error('Error updating invitation:', error);
      });
    onClose();
  };

  const dontAskAgain = async () => {
    const body = {
      invitation: invitationId,
      patch_body: {
        role: '',
        background: '',
        highest_degree: '',
        nlp_experience: '',
        ask_for_personal_data: false,
      },
    };
    axios
      .patch(endpoints.invitation, body, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .catch((error) => {
        console.error('Error updating invitation:', error);
      });
    onClose();
  };

  return (
    <Slide direction="up" in={open} mountOnEnter unmountOnExit timeout={{ enter: 1000, exit: 500 }}>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: '25%',
          transform: 'translateX(-25%)',
          width: '50vw',
          bgcolor: 'background.paper',
          boxShadow: 3,
          p: 3,
          zIndex: 1300,
          overflowY: 'auto', // Allow scrolling if content overflows
          display: 'flex',
          flexDirection: 'column',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton onClick={onClose} sx={{ position: 'absolute', top: '8px', right: '8px' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">What is your professional role?</FormLabel>
              <RadioGroup value={role} row onChange={(e) => setRole(e.target.value)}>
                <FormControlLabel value="Student" control={<Radio />} label="Student" />
                <FormControlLabel
                  value="Researcher"
                  control={<Radio />}
                  label="Researcher / PhD Candidate"
                />
                <FormControlLabel
                  value="Industry Professional"
                  control={<Radio />}
                  label="Industry Professional"
                />
                <FormControlLabel value="dev" control={<Radio />} label="Developer" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">What is your educational background?</FormLabel>
              <RadioGroup value={background} row onChange={(e) => setBackground(e.target.value)}>
                <FormControlLabel
                  value="Computer Science / Mathematics"
                  control={<Radio />}
                  label="Computer Science / Mathematics"
                />
                <FormControlLabel value="Engineering" control={<Radio />} label="Engineering" />
                <FormControlLabel value="Business" control={<Radio />} label="Business" />
                <FormControlLabel value="Medicine" control={<Radio />} label="Medicine" />
                <FormControlLabel value="Law" control={<Radio />} label="Law" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">What is highest degree?</FormLabel>
              <RadioGroup
                value={highestDegree}
                row
                onChange={(e) => setHighestDegree(e.target.value)}
              >
                <FormControlLabel value="Professor" control={<Radio />} label="Professor" />
                <FormControlLabel value="PhD" control={<Radio />} label="PhD" />
                <FormControlLabel value="Master" control={<Radio />} label="Master" />
                <FormControlLabel value="Bachelor" control={<Radio />} label="Bachelor" />
                <FormControlLabel
                  value="No Degree"
                  control={<Radio />}
                  label="No Degree / Degree in Progress"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <FormLabel component="legend">
                What is your experience in Natural Language Processing (NLP)?
              </FormLabel>
              <RadioGroup
                value={nlpExperience}
                row
                onChange={(e) => setNlpExperience(e.target.value)}
              >
                <FormControlLabel
                  value="Beginner"
                  control={<Radio />}
                  label="Beginner / None (0-1 years)"
                />
                <FormControlLabel
                  value="Intermediate"
                  control={<Radio />}
                  label="Intermediate (1-3 years)"
                />
                <FormControlLabel
                  value="Expert"
                  control={<Radio />}
                  label="Expert (3 or more years)"
                />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outlined" onClick={dontAskAgain}>
                Don't ask again
              </Button>
              <Button variant="contained" color="primary" onClick={handleSubmit} sx={{ mr: 2 }}>
                Submit
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Slide>
  );
}

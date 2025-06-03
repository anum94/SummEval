import {
  Box,
  Card,
  Checkbox,
  DialogContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { HelpOutline } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import * as React from 'react';

export default function ChooseExperiments({
  experiments,
  selectedExperiments,
  setSelectedExperiments,
}) {
  const handleSelect = (experiment) => {
    setSelectedExperiments((prevSelected) => {
      if (prevSelected.includes(experiment.pk)) {
        return prevSelected.filter((id) => id !== experiment.pk);
      } else {
        return [...prevSelected, experiment.pk];
      }
    });
  };

  return (
    <DialogContent>
      <Card sx={{ borderRadius: '10px', flex: 1, height: '60vh' }}>
        <Toolbar>
          <Box display="flex" alignItems="center">
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
              Which experiments should your survey include?
            </Typography>
            <Tooltip title="All summaries of each selected experiment will be included into the survey.">
              <IconButton>
                <HelpOutline sx={{ fontSize: 'inherit' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        {experiments.length === 0 ? (
          <Typography align="center" m={10}>
            No experiments to choose from.
          </Typography>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: '10px', maxHeight: '55vh', overFlow: 'auto' }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>LLM Name</TableCell>
                  <TableCell>Context Window</TableCell>
                  <TableCell>Max New Tokens</TableCell>
                  <TableCell width={10}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {experiments.map((experiment) => (
                  <TableRow key={experiment.pk}>
                    <TableCell>
                      <Checkbox
                        checked={selectedExperiments.includes(experiment.pk)}
                        onChange={() => handleSelect(experiment)}
                      />
                    </TableCell>
                    <TableCell>{experiment.fields.name}</TableCell>
                    <TableCell>{experiment.fields.llm_name}</TableCell>
                    <TableCell>{experiment.fields.context_window}</TableCell>
                    <TableCell>{experiment.fields.max_new_tokens}</TableCell>
                    <TableCell>
                      <IconButton
                        component={Link}
                        to={`/dashboard/experiment/${experiment.pk}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <OpenInNewIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </DialogContent>
  );
}

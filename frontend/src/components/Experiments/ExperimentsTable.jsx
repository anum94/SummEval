import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
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
  useTheme,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { blueberryTwilightPalette } from '@mui/x-charts/colorPalettes';
import DefineExperimentType from './DefineExperimentType.jsx';

export default function ExperimentsTable({
  project,
  experiments,
  addExperiment,
  fullTexts,
  totalFullTexts,
}) {
  const [openAddExperimentDialog, setOpenAddExperimentDialog] = React.useState(false);
  const theme = useTheme();

  return (
    <>
      {openAddExperimentDialog && (
        <DefineExperimentType
          handleClose={() => setOpenAddExperimentDialog(false)}
          project={project}
          fullTexts={fullTexts}
          addExperiment={addExperiment}
          totalFullTexts={totalFullTexts}
        />
      )}
      <Card variant="outlined" sx={{ borderRadius: '10px', flex: 1, height: '100%' }}>
        <Toolbar>
          <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
            Experiments
          </Typography>
          <div style={{ marginLeft: 20 }}>
            <Tooltip title="Add experiment">
              <Button
                variant="outlined"
                startIcon={<Add />}
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setOpenAddExperimentDialog(true)}
              >
                Add Experiment
              </Button>
            </Tooltip>
          </div>
        </Toolbar>
        {experiments.length === 0 ? (
          <Typography align="center" m={10}>
            No experiments yet
          </Typography>
        ) : (
          <Box sx={{ p: 2 }}>
            <TableContainer component={Paper} sx={{ borderRadius: '10px', maxHeight: 340 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>LLM Name</TableCell>
                    <TableCell>Context Window</TableCell>
                    <TableCell>Max New Tokens</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {experiments.map((experiment, index) => (
                    <TableRow
                      key={experiment.pk}
                      component={Link}
                      to={`/dashboard/project/${project.pk}/experiment/${experiment.pk}`}
                      state={{
                        experiment: experiment,
                        experiments: experiments,
                        supportsPagination: experiment.fields.supportsPagination,
                      }}
                      sx={{
                        cursor: 'pointer',
                        textDecoration: 'none',
                        '&:hover': {
                          backgroundColor:
                            theme.palette.mode === 'light' ? '#e0e0e0' : theme.palette.grey[700],
                        },
                      }}
                    >
                      <TableCell>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                          }}
                        >
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              borderRadius: 0.75,
                              bgcolor: blueberryTwilightPalette('light').at(index),
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>{experiment.fields.name}</TableCell>
                      <TableCell>{experiment.fields.llm_name}</TableCell>
                      <TableCell>{experiment.fields.context_window}</TableCell>
                      <TableCell>{experiment.fields.max_new_tokens}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Card>
    </>
  );
}

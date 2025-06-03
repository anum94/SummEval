import {
  Box,
  Button,
  Card,
  DialogContent,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline.js';
import * as React from 'react';
import { HelpOutline } from '@mui/icons-material';

export default function ChooseMetrics({
  newMetric,
  setNewMetric,
  highlightQuestion,
  setHighlightQuestion,
  selectedMetrics,
  setSelectedMetrics,
}) {
  const addMetric = async () => {
    if (!selectedMetrics.map((metric) => metric.name).includes(newMetric)) {
      await setSelectedMetrics((prevMetrics) => [...prevMetrics, newMetric]);
    }
    setNewMetric({ name: '', definition: '' });
  };
  const deleteMetric = (toDelete) => {
    setSelectedMetrics((prevMetrics) => prevMetrics.filter((metric) => metric !== toDelete));
  };

  return (
    <DialogContent>
      <Card sx={{ borderRadius: '10px', flex: 1, height: '100%', overflow: 'auto' }}>
        <Toolbar>
          <Box display="flex" alignItems="center">
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
              Do you want users to highlight text passages?
            </Typography>
            <Tooltip
              title={
                <Typography>
                  Invitees can highlight text passages. Tell them here what they should highlight,
                  if you want them to.
                </Typography>
              }
            >
              <IconButton>
                <HelpOutline sx={{ fontSize: 'inherit' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        <Grid container spacing={2} sx={{ padding: '2%' }}>
          <Grid item xs={12}>
            <TextField
              label="What should invitees highlight?"
              value={highlightQuestion}
              onChange={(e) => setHighlightQuestion(e.target.value)}
              fullWidth
            />
          </Grid>
        </Grid>
        <Toolbar>
          <Box display="flex" alignItems="center">
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
              Which metrics do you want to analyze?
            </Typography>
            <Tooltip
              title={
                <Typography>
                  Each metric will appear as a 1 (worst) to 5 (best) Likert scale.
                </Typography>
              }
            >
              <IconButton>
                <HelpOutline sx={{ fontSize: 'inherit' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
        <Grid container spacing={2} sx={{ padding: '2%' }}>
          
          <Grid item xs={12}>
            <TableContainer component={Paper} sx={{ borderRadius: '10px' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell align="center">Metric definition</TableCell>
                    <TableCell align="right"></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedMetrics.map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant={'body2'}>{metric.name}</Typography>
                      </TableCell>
                      <TableCell align={'left'}>
                        <Tooltip title={metric.definition} arrow>
                          <Typography
                            noWrap
                            style={{
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '35vw',
                            }}
                            variant={'body2'}
                          >
                            {metric.definition}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => deleteMetric(metric)}>
                          <DeleteOutlineIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          <Grid item xs={9}>
            <TextField
              label="Metric name"
              value={newMetric.name}
              onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={3}>
            <Button onClick={addMetric} variant="contained" sx={{ width: '100%', height: '100%' }}>
              Add
            </Button>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Metric definition (optional)"
              value={newMetric.definition}
              onChange={(e) => setNewMetric({ ...newMetric, definition: e.target.value })}
              fullWidth
            ></TextField>
          </Grid>
          
        </Grid>
      </Card>
    </DialogContent>
  );
}

import * as React from 'react';
import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Button, Typography, Chip } from '@mui/material';
import { Add } from '@mui/icons-material';

export default function AutoEvaluationTable({ evaluation_results, setOpenAddMetric }) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Typography>Metric</Typography>
            </TableCell>
            <TableCell width="100%">
              <Typography>Scores</Typography>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            evaluation_results !== null
              ? Object.keys(evaluation_results)
              .filter(metric => evaluation_results[metric] && Object.keys(evaluation_results[metric]).length > 0)
              .map((metric, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Typography>{metric}</Typography>
                    </TableCell>
                  <TableCell>
                    {
                      Object.keys(evaluation_results[metric]).map((score, i) => (
                        <Chip label={score + ": " + evaluation_results[metric][score]} sx={{ m: 0.1 }}/>
                      ))
                    }
                    </TableCell>
                </TableRow>
              ))
              : <TableRow>
                  <TableCell colSpan={2} align='center'>
                    <Typography>No evaluation results available</Typography>
                  </TableCell>
                </TableRow>  
          }

        </TableBody>
      </Table>
    </TableContainer>
  )
}
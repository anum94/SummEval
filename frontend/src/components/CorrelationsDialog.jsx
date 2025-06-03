import * as React from 'react';
import {
  Box,
  Tab,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Tooltip,
  IconButton,
} from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import Chart from 'react-apexcharts';

import { useTabs } from 'src/hooks/use-tabs';
import { CustomTabs } from './Custom-Tabs';
import axios, { endpoints } from '../utils/axios.js';

const TABS = [
  { value: 'pearson', label: 'Pearson' },
  { value: 'spearman', label: 'Spearman' },
];

const HeatmapChart = ({ data }) => {
  const isEmpty = !data || Object.keys(data).length === 0;
  const rows = !isEmpty && Object.keys(data);
  const columns = !isEmpty && Object.keys(data[rows[0]]);
  const series = !isEmpty && rows.map((row) => ({
    name: row,
    data: columns.map((col) => ({ x: col, y: data[row][col] })),
  }));

  const options = {
    chart: {
      type: 'heatmap',
    },
    dataLabels: {
      enabled: false,
    },
    colors: ['#007867'],
    xaxis: {
      categories: columns,
    },
    title: {
      text: 'Heatmap',
    },
  };

  return (
    <Box>
      {
        !isEmpty ? (
          <Chart options={options} series={series} type="heatmap" height={500} />
        ) : (
          <Typography p={8} textAlign="center">
            Not enough data available for correlation.
          </Typography>
        )
      }
    </Box>
  );
};

const allMetrics = [
  'bartscore',
  'bertscore',
  'bleu',
  'meteor',
  'rouge',
  'unieval',
  'llm_evaluation',
  'factscore',
];

export default function CorrelationsDialog({ open, onClose, experiments, humanEvaluation }) {
  const [correlations, setCorrelations] = React.useState(null);
  const tabs = useTabs('pearson');

  const renderTabs = (
    <CustomTabs value={tabs.value} onChange={tabs.onChange} variant="fullWidth">
      {TABS.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </CustomTabs>
  );

  const extractData = (experiments) => {
    const result = {};
    for (const [i, experiment] of experiments.entries()) {
      // Add automatic metric scores
      result[experiment.pk] = {};
      for (const metric of allMetrics) {
        if (
          !experiment.fields.evaluation_results ||
          !experiment.fields.evaluation_results[metric]
        ) {
          result[experiment.pk][metric] = {};
        } else {
          result[experiment.pk][metric] = experiment.fields.evaluation_results[metric];
        }
      }
      // Add human evaluation scores
      const humanEval = humanEvaluation.data.find((e) => e.experiment.id === experiment.pk);
      if (humanEval) {
        result[experiment.pk]['human_evaluation'] = humanEval.avg_evaluations;
      } else {
        result[experiment.pk]['human_evaluation'] = {};
      }
    }
    return result;
  };

  const fetchCorrelations = async (data) => {
    return axios
      .post(
        endpoints.fetchCorrelations,
        {
          data: data,
          human_evaluation_metrics: humanEvaluation.metrics,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      .then((response) => {
        return response.data;
      })
      .catch((error) => {
        console.error('Error calculating correlations:', error);
      });
  };

  React.useEffect(() => {
    if (open) {
      const extractedData = extractData(experiments);
      fetchCorrelations(extractedData)
        .then((response) => {
          setCorrelations(response);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
          <Box>
            Metric Correlations
            <Tooltip
              title={
                <Typography>
                  Correlations only include evaluation metrics that have been calculated for all
                  experiments.
                </Typography>
              }
            >
              <IconButton>
                <HelpOutline />
              </IconButton>
            </Tooltip>
          </Box>
          {renderTabs}
        </Box>
      </DialogTitle>
      <DialogContent>
        {correlations ? (
          <HeatmapChart data={correlations[tabs.value]} />
        ) : (
          <Typography>Loading...</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

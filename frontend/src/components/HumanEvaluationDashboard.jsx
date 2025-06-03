import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Tab,
  Tabs,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import * as React from 'react';
import { HelpOutline, Refresh } from '@mui/icons-material';
import { LoadingScreen } from './Loading/index.js';

import { useTabs } from 'src/hooks/use-tabs';
import { CustomTabs } from './Custom-Tabs/index.js';

function MetricChart({ metric, experiment_scores }) {
  return (
    <BarChart
      xAxis={[
        {
          scaleType: 'band',
          data: experiment_scores.data
            .filter((exp) => exp.avg_evaluations[metric] != null) // Experiments which have not been evaluated with a certain metric are null. We filter them out and don't show them.
            .map((exp) => exp.experiment.name),
        },
      ]}
      yAxis={[
        {
          min: 0,
          max: 5,
        },
      ]}
      series={[
        {
          data: experiment_scores.data
            .filter((exp) => exp.avg_evaluations[metric] != null)
            .map((exp) => exp.avg_evaluations[metric]),
        },
      ]}
      height={290}
      margin={{ top: 10, bottom: 30, left: 40, right: 10 }}
      grid={{ horizontal: true }}
      borderRadius={10}
    />
  );
}

export default function HumanEvaluationDashboard({ experiment_scores, loading, refresh }) {
  const tabs = loading ? null : useTabs(experiment_scores.metrics[0]);

  const renderTabs = loading ? null : (
    <CustomTabs value={tabs.value} onChange={tabs.onChange} variant="fullWidth">
      {experiment_scores.metrics.map((metric) => (
        <Tab key={metric} value={metric} label={metric} />
      ))}
    </CustomTabs>
  );

  return (
    <Card variant="outlined" sx={{ borderRadius: '10px', flex: 1, height: '100%' }}>
      <Toolbar>
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Human Evaluation Performance
          <Tooltip
            title={
              <Typography>
                This chart displays the average evaluation scores per experiment across all your
                surveys. Keep in mind that not all experiments might have been evaluated to the same
                metrics, depending on how you set up your surveys. Not evaluated experiments are
                filtered out accordingly.
              </Typography>
            }
          >
            <IconButton>
              <HelpOutline />
            </IconButton>
          </Tooltip>
        </Typography>

        {!loading && (
          <div style={{ marginLeft: 20 }}>
            <Tooltip title="The displayed data might be up to 30 minutes old. Click here to refresh.">
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                style={{ whiteSpace: 'nowrap' }}
                onClick={refresh}
              >
                Refresh
              </Button>
            </Tooltip>
          </div>
        )}
      </Toolbar>
      {loading ? (
        <Box height={'100%'}>
          <LoadingScreen />
        </Box>
      ) : (
        <>
          <CardContent>
            <MetricChart metric={tabs.value} experiment_scores={experiment_scores} />
          </CardContent>
          {renderTabs}
        </>
      )}
    </Card>
  );
}

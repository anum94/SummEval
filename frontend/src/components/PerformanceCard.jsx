import * as React from 'react';
import {
  Card,
  Toolbar,
  Typography,
  Tooltip,
  Tab,
  Box,
  IconButton,
  CardContent,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { HelpOutline, QueryStats } from '@mui/icons-material';
import CorrelationsDialog from './CorrelationsDialog';

import { useTabs } from 'src/hooks/use-tabs';
import { CustomTabs } from './Custom-Tabs';
import { ChartSelect } from 'src/components/Chart';


const allMetrics = {
  bartscore: ['recall', 'f_score', 'precision'],
  bertscore: ['f1', 'precision', 'recall'],
  bleu: ['bleu'],
  meteor: ['meteor'],
  rouge: ['rouge1', 'rouge2', 'rougeL'],
  unieval: ['fluency', 'overall', 'coherence', 'relevance', 'consistency'],
  llm_evaluation: ['Fluency', 'Coherence', 'Domain_Adaptation', 'Relevance', 'Consistency'],
  factscore: ['score']
};

const TABS = [
  { value: 'bartscore', label: 'BART' },
  { value: 'bertscore', label: 'BERT' },
  { value: 'bleu', label: 'BLEU' },
  { value: 'meteor', label: 'METEOR' },
  { value: 'rouge', label: 'ROUGE' },
  { value: 'unieval', label: 'UniEval' },
  { value: 'llm_evaluation', label: 'LLMEval' },
  { value: 'factscore', label: 'FactScore' },
];

function MetricChart({ metric, experiments, selectedMetric }) {

  const data = []
  if (selectedMetric === "All") {
    experiments.forEach((experiment) => {
      if (experiment.fields.evaluation_results) {
        data.push({ data: allMetrics[metric].map((key) => experiment.fields.evaluation_results[metric][key]), label: experiment.fields.name })
      }
    })
  } else {
    data.push({ data: experiments.map((exp) => exp.fields.evaluation_results && exp.fields.evaluation_results[metric][selectedMetric]), label: selectedMetric })
  }

  return (
    <BarChart
      series={data}
      height={290}
      xAxis={[{ data: selectedMetric === "All" ? allMetrics[metric] : experiments.map((exp) => exp.fields.name), scaleType: 'band' }]}
      margin={{ top: 5, bottom: 20, left: 40, right: 10 }}
      grid={{ horizontal: true }}
      borderRadius={10}
      slotProps={{ legend: { hidden: true } }}
    />
  );
}

export default function PerformanceCard({ experiments, humanEvaluation }) {
  const [openCorrelationsDialog, setOpenCorrelationsDialog] = React.useState(false);
  const tabs = useTabs('bartscore');
  const [selectedMetric, setSelectedMetric] = React.useState("All");

  React.useEffect(() => {
    // Reset selectedMetric whenever tabs.value changes
    setSelectedMetric("All"); // Or any default value you prefer
  }, [tabs.value]); // Dependency array, effect runs when tabs.value changes


  const handleChangeMetric = React.useCallback((newValue) => {
    setSelectedMetric(newValue);
  }, []);

  const renderTabs = (
    <CustomTabs
      value={tabs.value}
      onChange={tabs.onChange}
      variant="fullWidth"
    >
      {TABS.map((tab) => (
        <Tab key={tab.value} value={tab.value} label={tab.label} />
      ))}
    </CustomTabs>
  );

  return (
    <>
      <CorrelationsDialog open={openCorrelationsDialog} onClose={() => setOpenCorrelationsDialog(false)} experiments={experiments} humanEvaluation={humanEvaluation} />
      <Card variant="outlined" sx={{ borderRadius: "10px", flex: 1 }}>
        <Toolbar>
          <Box display="flex" alignItems="center">
            <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
              Score Evaluation Performance
            </Typography>
            <Tooltip
              title={
                <Typography>
                  This chart shows the automatically calculated performance scores for all your
                  experiments. You can add more scores individually for each experiment.
                </Typography>
              }
            >
              <IconButton>
                <HelpOutline />
              </IconButton>
            </Tooltip>
          </Box>
          <div style={{ marginLeft: "auto" }}>
            <Tooltip title="View correlations">
              <IconButton
                onClick={() => setOpenCorrelationsDialog(true)}
              >
                <QueryStats />
              </IconButton>
            </Tooltip>
          </div>
        </Toolbar>
        <Box px={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ChartSelect
            options={["All", ...allMetrics[tabs.value].map((key) => key)]}
            value={selectedMetric}
            onChange={handleChangeMetric}
          />
        </Box>
        <CardContent>
          <MetricChart metric={tabs.value} experiments={experiments} selectedMetric={selectedMetric} />
        </CardContent>

        {renderTabs}

      </Card>
    </>
  );
}

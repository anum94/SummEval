import { useState } from 'react';
import { m } from 'framer-motion';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Accordion, { accordionClasses } from '@mui/material/Accordion';
import AccordionDetails, { accordionDetailsClasses } from '@mui/material/AccordionDetails';
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary';

import { varAlpha } from '../../../theme/styles';

import { varFade, MotionViewport } from '../../../components/Animate';

import { SectionTitle } from '../components/sectionTitle';


const FAQs = [
  {
    question: 'What can I do on this platform',
    answer: (
      <Typography>
        With SummEval you can get human feedback on your LLM-generated summaries. 
        By uploading your experiments, you can get feedback on the quality of your summaries, and compare them to other models.
      </Typography>
    ),
  },
  {
    question: 'How do I get started?',
    answer: (
      <Typography>
        You need to create an account and upload your experiments. 
        You can then select the experiments you want to evaluate, and choose the metrics you want to use. 
        You can then submit your experiments for evaluation and create a survey.
      </Typography>
    ),
  },
  {
    question: 'Which metrics can I use to evaluate my experiments?',
    answer: (
      <Typography>
        You can use a variety of metrics to evaluate your experiments, including ROUGE, BLEU, and METEOR. 
        All metrics that are commonly used in NLP evaluation are supported. 
        You can also use custom metrics, and compare your results to other models.
        You are also able to see the correlation between the different metrics.
      </Typography>
    ),
  },
  {
    question: 'Which other features does SummEval offer?',
    answer: (
      <Typography>
        SummEval offers a variety of features to help you evaluate your experiments. 
        By creating projects you can also compare models in different domains to better understand their performance of your models. 
        On the dashboard you can see an overview of all your experiments and compare them to each other.
      </Typography>
    ),
  },
  {
    question: 'How much does using SummEval cost?',
    answer: (
      <Typography>
        SummEval is free to use for all users. 
        We want to make a meaningful contribution to the NLP community and help researchers evaluate their experiments.
        So, you can just create an account and start evaluating your experiments right away. 
      </Typography>
    ),
  },
];


export function HomeFAQs({ sx, ...other }) {
  const [expanded, setExpanded] = useState(FAQs[0].question);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const renderDescription = (
    <SectionTitle
      caption="FAQs"
      title="We’ve got the answers"
      sx={{ textAlign: 'center' }}
    />
  );

  const renderContent = (
    <Stack
      spacing={1}
      sx={{
        mt: 8,
        mx: 'auto',
        maxWidth: 720,
        mb: { xs: 5, md: 8 },
      }}
    >
      {FAQs.map((item, index) => (
        <Accordion
          key={item.question}
          component={m.div}
          variants={varFade({ distance: 24 }).inUp}
          expanded={expanded === item.question}
          onChange={handleChange(item.question)}
          sx={{
            borderRadius: 2,
            transition: (theme) =>
              theme.transitions.create(['background-color'], {
                duration: theme.transitions.duration.short,
              }),
            '&::before': { display: 'none' },
            '&:hover': {
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
            },
            '&:first-of-type, &:last-of-type': { borderRadius: 2 },
            [`&.${accordionClasses.expanded}`]: {
              m: 0,
              borderRadius: 2,
              boxShadow: 'none',
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
            },
            [`& .${accordionSummaryClasses.root}`]: {
              py: 3,
              px: 2.5,
              minHeight: 'auto',
              [`& .${accordionSummaryClasses.content}`]: {
                m: 0,
                [`&.${accordionSummaryClasses.expanded}`]: { m: 0 },
              },
            },
            [`& .${accordionDetailsClasses.root}`]: { px: 2.5, pt: 0, pb: 3 },
          }}
        >
          <AccordionSummary
            aria-controls={`panel${index}bh-content`}
            id={`panel${index}bh-header`}
          >
            <Typography variant="h6"> {item.question}</Typography>
          </AccordionSummary>
          <AccordionDetails>{item.answer}</AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );

  const renderContact = (
    <Stack
      alignItems="center"
      sx={{
        px: 3,
        py: 8,
        textAlign: 'center',
        background: (theme) => `linear-gradient(270deg, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}, ${varAlpha(theme.vars.palette.grey['500Channel'], 0)})`,
      }}
    >
      <m.div variants={varFade().in}>
        <Typography variant="h4">Still have questions?</Typography>
      </m.div>

      <m.div variants={varFade().in}>
        <Typography sx={{ mt: 2, mb: 3, color: 'text.secondary' }}>
          Please describe your case to receive the most accurate advice
        </Typography>
      </m.div>

      <m.div variants={varFade().in}>
        <Button
          color="inherit"
          variant="contained"
          href="mailto:anum.afzal@tum.de?subject= Feedback from User"
        >
          Contact us
        </Button>
      </m.div>
    </Stack>
  );

  return (
    <Stack component="section" sx={{ ...sx }} {...other}>
      <MotionViewport sx={{ py: 10, position: 'relative' }}>

        <Container>
          {renderDescription}
          {renderContent}
        </Container>
        {renderContact}
      </MotionViewport>
    </Stack>
  );
}


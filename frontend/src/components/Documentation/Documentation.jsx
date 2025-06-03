import { useState } from 'react';
import {
  Typography,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Container,
  Paper,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClickableImage from './ClickableImage';

const guideSteps = [
  'Create a Project',
  'Create Experiments',
  'Create a Survey',
  'Annotate & Evaluate',
  'View Results',
];

const Documentation = () => {
  const [step, setStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasLLMSummaries, setHasLLMSummaries] = useState(null);
  const [hasCustomModel, setHasCustomModel] = useState(null);
  const [expandedPanels, setExpandedPanels] = useState({});

  const handleAccordionChange = (panel) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [panel]: !prev[panel],
    }));
    setCurrentStep(panel);
  };

  const resetGuide = () => {
    setStep(0);
    setHasLLMSummaries(null);
    setHasCustomModel(null);
  };

  return (
    <Container>
      <Paper elevation={3} sx={{ padding: 4, marginTop: 4 }}>
        <Typography variant="h4" gutterBottom>
          SummEval Documentation
        </Typography>
        <Typography variant="subtitle1">
          Learn how to use SummEval as a Researcher or Annotator.
        </Typography>

        {/* Stepper for Process Overview */}
        <Stepper activeStep={currentStep} alternativeLabel sx={{ marginY: 4 }}>
          {guideSteps.map((step, index) => (
            <Step key={index}>
              <StepLabel onClick={() => setCurrentStep(index)}>{step}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* 1. Creating a Research Project */}
        <Accordion expanded={expandedPanels[0]} onChange={() => handleAccordionChange(0)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h3">1. Creating a Research Project</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body6" gutterBottom>
              {"Let's start by creating your first project! Follow the steps below:"}
            </Typography>

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              {' '}
              {'Step 1: Click "Create Project"'}
            </Typography>
            <Typography variant="body5">
              Navigate to the Dashboard section and click on{' '}
              <strong>&quot;Create Project&quot;</strong> to start.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/create_project_button.png"
              altText="Create Project Button"
            />

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 2: Fill in Project Details
            </Typography>
            <Typography variant="body5">
              Provide a <strong>Project Name</strong>, <strong>Description</strong>, and{' '}
              <strong>Tags</strong> to organize your project.
            </Typography>

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 3: Upload CSV File
            </Typography>
            <Typography variant="body5">
              Drag and drop or select your <strong>CSV file</strong> containing summaries. Ensure
              the file structure is correct.
            </Typography>

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 4: Select the Correct Columns
            </Typography>
            <Typography variant="body5">
              Select the column containing the full texts (e.g., <strong>Article</strong>) and the
              column containing reference summaries (e.g., <strong>Ref_summary</strong>).
            </Typography>
            <ClickableImage imageSrc="/screenshots/project_form.png" altText="Project Form" />

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 5: Submit the Project
            </Typography>
            <Typography variant="body5">
              Click <strong>&quot;Create Project&quot;</strong> to finalize the process.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* 2. Understanding Evaluation Metrics */}
        <Accordion expanded={expandedPanels[1]} onChange={() => handleAccordionChange(1)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h3">2. Creating Experiments</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* General Information for Selected Indices (Fixed & Custom Index Selection) */}
            <Typography variant="h4" gutterBottom>
              Understanding Index Selection
            </Typography>
            <Typography variant="body5">
              When creating an experiment, you do <strong>not</strong> have to include all full
              texts from your project. Instead, you can <strong>select specific indices</strong> to
              define which full texts will be part of the experiment.
            </Typography>

            {/* Fixed Index Mode */}
            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Fixed Index Mode
            </Typography>
            <Typography variant="body5">
              This mode allows you to <strong>batch select a fixed range of full texts</strong> at a
              time. For example, you can select records <strong>1-100</strong>,{' '}
              <strong>201-300</strong>, etc.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/fixed index.png"
              altText="Fixed Index Mode Example"
            />

            {/* Custom Index Mode */}
            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Custom Index Mode
            </Typography>
            <Typography variant="body5">
              This mode allows you to <strong>manually pick specific indices</strong> instead of
              selecting a fixed range. For example, you can choose full texts{' '}
              <strong>1-3, 5-7</strong>, and any other combination.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/custom_model_index.png"
              altText="Custom Index Mode Example"
            />
            <br></br>
            {/* CSV Sequence Requirement */}
            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Important: CSV Sequence Requirement
            </Typography>
            <Typography variant="body5">
              If you are using a CSV file, you must ensure the summaries in the CSV match the
              <strong> selected indices</strong>:
            </Typography>
            <ul>
              <li>
                <br></br>
                Fixed Index Mode: If you select 201-300, your CSV must contain exactly 100 summaries
                in that range.
              </li>
              <li>
                <br></br>
                Custom Index Mode: If you select indices 1-3, 5-7, your CSV must have:
                <ul>
                  <li>Summaries for 1-3 appearing in rows 1-3.</li>
                  <li>Summaries for 5-7 appearing in rows 4-6.</li>
                </ul>
              </li>
            </ul>
            <br></br>
            <Typography variant="body5" color="error">
              Failing to match the selected indices with the CSV order will result in incorrect
              full-text & summary pairing.
            </Typography>

            <Box sx={{ marginBottom: 5 }} />

            {/* Conditional Stepper Based on User Choice */}
            <Typography variant="h4">Understanding Experiments Type</Typography>
            <Box sx={{ marginBottom: 4 }} />
            {hasLLMSummaries === null ? (
              <Stepper activeStep={step} alternativeLabel sx={{ marginBottom: 3 }}>
                <Step>
                  <StepLabel>LLM Summaries</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Custom Model</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Experiment Form</StepLabel>
                </Step>
              </Stepper>
            ) : hasLLMSummaries ? (
              <Stepper activeStep={step} alternativeLabel sx={{ marginBottom: 3 }}>
                <Step>
                  <StepLabel>Upload CSV</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Experiment Form</StepLabel>
                </Step>
              </Stepper>
            ) : (
              <Stepper activeStep={step} alternativeLabel sx={{ marginBottom: 3 }}>
                <Step>
                  <StepLabel>Custom/Select Model?</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Choose Model</StepLabel>
                </Step>
                <Step>
                  <StepLabel>Experiment Form</StepLabel>
                </Step>
              </Stepper>
            )}

            {/* Step 1: Do you have LLM-generated summaries? */}
            {step === 0 && (
              <>
                <Typography variant="h4" gutterBottom>
                  Step 1: Do you have previously generated LLM summaries for your full texts?
                </Typography>
                <Typography variant="body5" gutterBottom>
                  If <strong>YES</strong>, upload a CSV with the required columns (
                  <strong>Prompt</strong> and <strong>Summary</strong>). If <strong>No</strong>,
                  answer the next question.
                </Typography>
                <ClickableImage
                  imageSrc="/screenshots/experiment_question_1.png"
                  altText="Experiment Question 1"
                />

                {/* Yes/No Buttons */}
                <Box sx={{ marginTop: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ marginRight: 2 }}
                    onClick={() => {
                      setHasLLMSummaries(true);
                      setStep(1);
                    }}
                  >
                    Yes, I have a CSV
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setHasLLMSummaries(false);
                      setStep(1);
                    }}
                  >
                    No
                  </Button>
                </Box>
              </>
            )}

            {/* Step 2: Do you have a custom model? */}
            {step === 1 && hasLLMSummaries === false && (
              <>
                <Typography variant="h4" gutterBottom>
                  Step 2: Do you have your own models deployed?
                </Typography>
                <Typography variant="body5" gutterBottom>
                  If <strong>YES</strong>, provide your model's <strong>API Endpoint</strong>. If{' '}
                  <strong>NO</strong>, you can select a model from OpenAI or TogetherAI.
                </Typography>
                <ClickableImage
                  imageSrc="/screenshots/experiment_question_2.png"
                  altText="Experiment Question 2"
                />

                {/* Yes/No Buttons */}
                <Box sx={{ marginTop: 2 }}>
                  <Button
                    variant="contained"
                    sx={{ marginRight: 2 }}
                    onClick={() => {
                      setHasCustomModel(true);
                      setStep(2);
                    }}
                  >
                    Yes, I have an API
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setHasCustomModel(false);
                      setStep(2);
                    }}
                  >
                    No, I'll use provided models
                  </Button>
                </Box>
              </>
            )}

            {/* Step 2: Upload CSV for LLM Summaries Path */}
            {step === 1 && hasLLMSummaries && (
              <>
                <Typography variant="h4" gutterBottom>
                  Step 2: Upload CSV and Complete Experiment Setup
                </Typography>
                <Typography variant="body5">
                  Upload your <strong>CSV file</strong> with the <strong>Prompt</strong> and{' '}
                  <strong>Predicted Summary</strong> columns.
                </Typography>
                <ClickableImage
                  imageSrc="/screenshots/csv experiment.png"
                  altText="CSV Upload Form"
                />

                <Box sx={{ marginTop: 3 }}>
                  <Button variant="outlined" color="error" onClick={resetGuide}>
                    Restart
                  </Button>
                </Box>
              </>
            )}

            {/* Step 3: Experiment Form Based on Choices */}
            {step === 2 && (
              <>
                <Typography variant="h4" gutterBottom>
                  Step 3: Fill in the Experiment Form
                </Typography>

                {/* If User Has Custom Model*/}
                {hasCustomModel && (
                  <>
                    <Typography variant="body5">
                      Provide the <strong>API Endpoint</strong> of your custom model.
                    </Typography>
                    <ClickableImage
                      imageSrc="/screenshots/api endpoint.png"
                      altText="API Input Form"
                    />
                  </>
                )}

                {/* If User Chose Pre-Provided Models*/}
                {!hasCustomModel && !hasLLMSummaries && (
                  <>
                    <Typography variant="body5">
                      Select a model from the available options ({' '}
                      <strong>OpenAI, TogetherAI, etc.</strong>) and enter your{' '}
                      <strong>API Key</strong>.
                    </Typography>
                    <ClickableImage
                      imageSrc="/screenshots/selected model.png"
                      altText="Model Selection"
                    />
                  </>
                )}

                {/* Restart */}
                <Box sx={{ marginTop: 3 }}>
                  <Button variant="outlined" color="error" onClick={resetGuide}>
                    Restart
                  </Button>
                </Box>
              </>
            )}
          </AccordionDetails>
        </Accordion>
        {/* 3. Create Survey */}
        <Accordion expanded={expandedPanels[3]} onChange={() => handleAccordionChange(3)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h3">3. Create a Survey</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="h4" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
              🎉 Congratulations! You have created your first experiment!
            </Typography>
            <Typography variant="body5" gutterBottom>
              After a short processing time, you will see the{' '}
              <strong>auto-evaluation results</strong>.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/experiment result.png"
              altText="Experiment Result"
            />

            <Typography variant="h4" sx={{ marginTop: 3 }}>
              Start a Survey for Annotation
            </Typography>
            <Typography variant="body5" gutterBottom>
              In order to allow annotators to provide feedback,{' '}
              <strong>Researchers need to create a survey first</strong>. A survey consists of{' '}
              <strong>three steps</strong>:
            </Typography>

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 1: Select the Experiment for Annotation
            </Typography>
            <Typography variant="body6">
              Choose the experiment you want to start a survey for.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/first step.png"
              altText="Select Experiment for Annotation"
            />

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 2: Define Highlighting & Additional Metrics
            </Typography>
            <Typography variant="body6">
              Researchers can specify which parts of the summaries should be highlighted and add
              extra evaluation metrics with descriptions.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/step2.png"
              altText="Define Highlighting and Metrics"
            />

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 3: Invite Annotators
            </Typography>
            <Typography variant="body6">
              Researchers need to provide annotators' emails to grant them access for reviewing the
              summaries.
            </Typography>
            <ClickableImage imageSrc="/screenshots/step 3.png" altText="Provide Annotator Emails" />

            <Typography variant="body5" sx={{ marginTop: 3, fontStyle: 'italic' }}>
              Once the survey is created, annotators can start rating the summaries and providing
              feedback.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* 4. Viewing and Comparing Results */}
        <Accordion expanded={expandedPanels[4]} onChange={() => handleAccordionChange(4)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h3">4. Annotate & Evaluate</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="h5" sx={{ marginBottom: 2 }}>
              Annotators evaluate the summaries based on provided metrics, highlight key parts, and
              leave comments.
            </Typography>
            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 1: Annotator Survey
            </Typography>
            <Typography variant="body6">
              Before starting the evaluation, annotators must complete a short survey collecting
              basic information. This helps researchers understand the annotators&apos; backgrounds.
            </Typography>

            <ClickableImage
              imageSrc="/screenshots/annotator_survey.png"
              altText="Annotator Survey"
            />
            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 2: Evaluating Summaries
            </Typography>
            <Typography variant="body6">
              Annotators will rate the summaries based on the evaluation metrics set by the
              researcher. These scores help quantify the quality, fluency, relevance, and
              coherence..etc of summaries.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/annotator_scores.png"
              altText="Providing Evaluation Scores"
            />

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 3: Highlight & Comment
            </Typography>
            <Typography variant="body6">
              In addition to scoring, annotators can highlight sentences in summaries and add
              comments. Highlights use three colors to indicate different types of feedback:
            </Typography>
            <ul>
              <li>
                <span style={{ color: 'green', fontWeight: 'bold' }}>🟩 Green:</span> Sentences align well with the current metrics
              </li>
              <li>
                <span style={{ color: 'yellow', fontWeight: 'bold' }}>🟨 Yellow:</span> Sentences highlighted are not contextually appropriate / correct but remain permissible
              </li>
              <li>
                <span style={{ color: 'red', fontWeight: 'bold' }}>🟥 Red:</span> Sentences that do not align with the current metrics and may be incorrect, misleading, or unclear
              </li>
            </ul>

            <ClickableImage
              imageSrc="/screenshots/highlighting_comments.png"
              altText="Highlighting Sentences and Adding Comments"
            />

            <Typography variant="h4" sx={{ marginTop: 2 }}>
              Step 4: Hover to View Comments
            </Typography>
            <Typography variant="body6">
              After highlighting and commenting, annotators can hover over a highlighted sentence to
              view the corresponding comments and feedback.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/hover_comments.png"
              altText="Hover Over Highlighted Sentences"
            />

            <Typography variant="body5" sx={{ marginTop: 3, fontStyle: 'italic' }}>
              This feedback will be collected and analyzed to compare different summarization
              models.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion expanded={expandedPanels[5]} onChange={() => handleAccordionChange(5)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h3">5. View Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="h5" sx={{ marginBottom: 2 }}>
              Researchers can view the annotation results both in the Survey Page and the
              Experiment Details Page.
            </Typography>
            <Typography variant="body5" gutterBottom>
              Once annotators have completed their evaluations, researchers can access the
              results in two ways:
            </Typography>
            <Typography variant="h4" sx={{ marginTop: 2 }}>
              1. Survey Page
            </Typography>
            <Typography variant="body6">
              The Survey Page provides an overview of all collected annotations and
              feedback.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/survey_results.png"
              altText="Survey Page Results"
            />
            <ClickableImage
              imageSrc="/screenshots/survey results1.png"
              altText="Survey Page Results"
            />

            {/* Experiment Details Page Result */}
            <Typography variant="h4" sx={{ marginTop: 3 }}>
              2. Experiment Details Page
            </Typography>
            <Typography variant="body6">
              The Experiment Details Page displays detailed metrics, comments, and model
              comparisons.
            </Typography>
            <ClickableImage
              imageSrc="/screenshots/experiment_results.png"
              altText="Experiment Details Page Results"
            />

            <Typography variant="h4" sx={{ marginTop: 3, fontWeight: 'bold', color: 'green' }}>
              🎉 Congratulations! You have completed the full journey with SummEval!
            </Typography>
            <Typography variant="body5" sx={{ marginTop: 1 }}>
              From creating projects to gathering human feedback on AI-generated summaries,
              you have successfully explored every step of the SummEval workflow.
            </Typography>
            <Typography variant="body5" sx={{ marginTop: 1 }}>
              We hope SummEval helps in improving summarization models and advancing research in
              NLP evaluation.
            </Typography>
            <Typography variant="body5" sx={{ marginTop: 1, fontStyle: 'italic' }}>
              Thank you for using SummEval! 
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Paper>
    </Container>
  );
};

export default Documentation;

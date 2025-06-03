import { useState } from 'react';
import {
  Alert,
  Box,
  Card,
  Collapse,
  Container,
  IconButton,
  List,
  ListItem,
  Typography,
} from '@mui/material';
import TextDisplay from './TextDisplay.jsx';
import './SummaryEvaluation.css';
import { useLoaderData } from 'react-router-dom';
import EvaluatorData from './Evaluations/EvaluatorData.jsx';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function SummaryEvaluation() {
  const { survey, invitation, texts, error } = useLoaderData();

  const [openEvaluatorData, setOpenEvaluatorData] = useState(true);

  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <Box className="full-height-container">
      <Container className="content-container">
        {error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box className="text-display-container">
            <Card
              variant={'outlined'}
              sx={{
                marginBottom: 5,
              }}
            >
              <Box
                sx={{
                  padding: '16px',
                  borderRadius: '20px',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant={'h4'}>What can I do here?</Typography>
                  <IconButton onClick={() => setShowTutorial(!showTutorial)}>
                    {showTutorial ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={showTutorial}>
                  <Box>
                    <Typography>
                      SummEval is a platform allowing experts in the field of Natural Language
                      Processing (NLP) to evaluate the text summarization capabilities of their
                      Large Language Models. To accomplish that, somebody has invited you to
                      participate in their research project. Your task is to provide feedback on the
                      text summaries below. We suggest that you proceed as follows:
                    </Typography>
                    <ol>
                      <li>
                        <Typography>
                          Read the original fulltext article (left box) carefully.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Read the corresponding LLM-generated text summary (right box).
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Rate the summary based on predefined criteria on a scale of 1 (worst) to 5
                          (best). In case you find it unclear what a certain metric means, you can
                          hover over the "?" next to it check and the provided definition. (Some
                          metrics may not provide a definition.)
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          You can also highlight text passages. Project admins may have provided
                          advice on what kind of information you should highlight. You can find the
                          advice before the summary.
                        </Typography>
                      </li>
                      <li>
                        <Typography>Optionally, you can provide a conclusive comment.</Typography>
                      </li>
                      <li>
                        <Typography>Submit your evaluation via the submit button.</Typography>
                      </li>
                      <li>
                        <Typography>
                          Proceed with the next summary to a certain fulltext by using the
                          navigation arrows in the upper right corner.
                        </Typography>
                      </li>
                      <li>
                        <Typography>
                          Once you rated all summaries, proceed with the next fulltext. You need to
                          scroll down to see it together with its corresponding summaries. You can
                          track your evaluation progress for each fulltext via the bar above it.
                        </Typography>
                      </li>
                    </ol>
                  </Box>
                </Collapse>
              </Box>
            </Card>
            {texts.map((text, index) => (
              <TextDisplay
                key={index}
                originalText={text.full_text}
                summaries={text.summaries}
                metrics={survey.metrics}
                index={index}
                numberOfArticles={texts.length}
                survey={survey}
              />
            ))}
          </Box>
        )}
      </Container>
      {!error && invitation.ask_for_personal_data && (
        <EvaluatorData
          open={openEvaluatorData}
          onClose={(e) => setOpenEvaluatorData(false)}
          invitationId={invitation.uuid}
        />
      )}
    </Box>
  );
}

export default SummaryEvaluation;

import { Box, Button, Chip, Grid, Skeleton, Stack, Typography } from '@mui/material';
import { Outlet, useParams } from 'react-router-dom';
import Toolbar from '../Global/Toolbar.jsx';
import ExperimentsTable from '../Experiments/ExperimentsTable.jsx';
import FullTextsList from '../FullTextsList.jsx';
import PerformanceCard from '../PerformanceCard.jsx';
import HumanEvaluationDashboard from '../HumanEvaluationDashboard.jsx';
import MySurveys from '../Surveys/MySurveys.jsx';
import { useContext, useEffect, useState } from 'react';
import { SplashScreen } from '../Loading/index.js';
import axios, { endpoints } from '../../utils/axios.js';
import DeleteProjectDialog from './DeleteProjectDialog.jsx';
import ShareProjectDialog from './ShareProjectDialog.jsx';

import { ProjectsContext } from '../../ProjectsProvider.jsx';

export default function ProjectDetails() {
  // const { full_texts, experiments, surveys, experiment_scores } = useLoaderData();
  const [project, setProject] = useState();
  const [experimentsLoading, setExperimentsLoading] = useState(true);
  const [surveysLoading, setSurveysLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [fullTextsLoading, setFulltextsLoading] = useState(true);
  const [experiments, setExperiments] = useState();
  const [surveys, setSurveys] = useState();
  const [experiment_scores, setExperimentScores] = useState();
  const [fullTexts, setFullTexts] = useState();
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isPaginated, setIsPaginated] = useState(false);
  const [totalFullTexts, setTotalFullTexts] = useState(0);
  const [shareProjectDialogOpen, setShareProjectDialogOpen] = useState(false);

  const { fetchProjects } = useContext(ProjectsContext); // Access refreshProjects from context

  const handleRefresh = () => {
    console.log('Refresh project is called in project details');

    fetchProjects(); // Call the function to trigger a refresh
  };

  const { id } = useParams();

  const THIRTY_MINUTE_CACHE_TIMEOUT = 30 * 60 * 1000;
  const CACHE_KEY = `project_fulltexts_${id}`;

  const getCachedFullTexts = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data, totalCount, hasMorePages, currentPageStored } = JSON.parse(cached);
        if (new Date() - new Date(timestamp) <= THIRTY_MINUTE_CACHE_TIMEOUT) {
          return {
            fullTexts: data,
            totalCount,
            hasMorePages,
            currentPageStored,
            isValid: true,
          };
        }
      }
      return { isValid: false };
    } catch (error) {
      console.error('Error reading from cache:', error);
      return { isValid: false };
    }
  };

  const cacheFullTexts = (data, count, hasMorePages, currentPageStored) => {
    try {
      const cacheData = {
        timestamp: new Date(),
        data,
        totalCount: count,
        hasMorePages,
        currentPageStored,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error writing to cache:', error);
    }
  };

  const clearCache = () => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  function refreshExperimentEvaluations() {
    setScoresLoading(true);
    try {
      axios.get(`${endpoints.survey.evaluations}?project=${id}`).then((response) => {
        if (response.status === 200) {
          const scores = response.data;
          setExperimentScores(scores);
          setScoresLoading(false);
          localStorage.setItem(
            `project_evaluations_${id}`,
            JSON.stringify({
              timestamp: new Date(),
              experiment_scores: scores,
            })
          );
        }
      });
    } catch (error) {
      console.error('Error fetching scores:', error);
      setScoresLoading(false);
    }
  }

  const fetchFullTexts = async (page = 1, shouldAppend = false) => {
    try {
      setFulltextsLoading(true);
      const response = await axios.get(`${endpoints.fulltexts}?project=${id}&page=${page}`);
      const { results, next, count, page_size } = response.data;

      let updatedFullTexts;
      if (shouldAppend && fullTexts) {
        updatedFullTexts = [...fullTexts, ...results];
      } else {
        updatedFullTexts = results;
      }

      const totalPages = Math.ceil(count / page_size);

      setFullTexts(updatedFullTexts);
      setTotalFullTexts(count);
      setIsPaginated(!!next);
      setHasMore(!!next);
      setFulltextsLoading(false);

      cacheFullTexts(updatedFullTexts, count, !!next, page);

      return totalPages;
    } catch (error) {
      console.error('Error fetching full texts:', error);
      setFulltextsLoading(false);
    }
  };

  const addExperiment = async () => {
    try {
      const response = await axios.get(`${endpoints.experiments.summary}?project=${id}`);
      if (response.status === 200) {
        const updatedExperiments = response.data.map((experiment) => ({
          ...experiment,
          fields: {
            name: experiment.fields.name,
            llm_name: experiment.fields.llm_name,
            context_window: experiment.fields.context_window,
            max_new_tokens: experiment.fields.max_new_tokens,
            evaluation_results: experiment.fields.evaluation_results,
            supportsPagination: experiment.fields.supportsPagination,
            owner: experiment.fields.owner,
            project: experiment.fields.project,
          },
        }));
        handleRefresh();
        setExperiments(updatedExperiments);
      }
    } catch (error) {
      console.error('Error re-fetching experiments:', error);
    }
  };

  useEffect(() => {
    setExperimentsLoading(true);
    setSurveysLoading(true);
    setScoresLoading(true);
    setFulltextsLoading(true);

    const cachedFullTexts = getCachedFullTexts();
    if (cachedFullTexts.isValid) {
      setFullTexts(cachedFullTexts.fullTexts);
      setTotalFullTexts(cachedFullTexts.totalCount);
      setHasMore(cachedFullTexts.hasMorePages);
      setIsPaginated(cachedFullTexts.hasMorePages);
      setCurrentPage(cachedFullTexts.currentPageStored);
      setFulltextsLoading(false);
    } else {
      fetchFullTexts(1, false);
    }
    try {
      axios.get(`${endpoints.experiments.summary}?project=${id}`).then((response) => {
        if (response.status === 200) {
          const fetchedExperiments = response.data.map((experiment) => ({
            ...experiment,
            fields: {
              name: experiment.fields.name,
              llm_name: experiment.fields.llm_name,
              context_window: experiment.fields.context_window,
              max_new_tokens: experiment.fields.max_new_tokens,
              evaluation_results: experiment.fields.evaluation_results,
              supportsPagination: experiment.fields.supportsPagination,
              indexedRange: experiment.fields.indexedRange, // index range
              indices: experiment.fields.indexedRange?.indices || [], // exact indices
              owner: experiment.fields.owner,
              project: experiment.fields.project,
            },
          }));
          setExperiments(fetchedExperiments);
          console.log('Transformed Experiments:', fetchedExperiments);
          setExperimentsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error fetching experiments:', error);
    }

    try {
      axios.get(`${endpoints.survey.default}?project=${id}`).then((response) => {
        if (response.status === 200) {
          setSurveys(response.data);
          setSurveysLoading(false);
        }
      });
    } catch (error) {
      console.error('Error fetching surveys:', error);
    }

    const cached_project_evaluations = localStorage.getItem(`project_evaluations_${id}`);
    if (
      cached_project_evaluations &&
      new Date() - new Date(JSON.parse(cached_project_evaluations).timestamp) <=
        THIRTY_MINUTE_CACHE_TIMEOUT
    ) {
      const parsed_project_evaluations = JSON.parse(cached_project_evaluations);
      setExperimentScores(parsed_project_evaluations.experiment_scores);
      setScoresLoading(false);
    } else {
      refreshExperimentEvaluations();
    }

    const cached_project = JSON.parse(localStorage.getItem(`projects`)).projects.find(
      (project) => project.pk === parseInt(id)
    );
    setProject(cached_project);

    // Cleanup function
    return () => {
      setExperimentsLoading(true);
      setSurveysLoading(true);
      setScoresLoading(true);
      setFulltextsLoading(true);
    };
  }, [id]);

  //const project = useLocation().state.project;

  return experimentsLoading || surveysLoading || fullTextsLoading ? (
    <SplashScreen />
  ) : (
    <Box
      component="main"
      sx={{
        flexGrow: 1,
        p: 4,
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden',
      }}
    >
      {!window.location.pathname.includes('/experiment/') && (
        <>
          <Toolbar
            title={
              <Stack direction="column" spacing={1}>
                <Typography variant="h6">{project.fields.name}</Typography>
                {/* Separate Stack for Tags */}
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {project.fields.tags.length > 0
                    ? project.fields.tags.map(
                        (tag) =>
                          tag.length !== 0 && <Chip key={tag} label={tag} variant="outlined" />
                      )
                    : null}
                </Stack>
              </Stack>
            }
            subtitles={[
              ['Description:', project.fields.description],
              ['Total experiments:', experiments.length],
              ['Number of full texts:', totalFullTexts || 'Loading...'],
            ]}
            button={
              <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
                {project.fields.invite_status === null || !project.fields.invite_status ? (
                  <>
                    <Button
                      variant="soft"
                      color="primary"
                      onClick={() => setShareProjectDialogOpen(true)}
                      sx={{ minWidth: 120, height: 40 }} // Set fixed width and height for stability
                    >
                      Share Project
                    </Button>
                    <Button
                      variant="soft"
                      color="error"
                      onClick={() => setDeleteProjectDialogOpen(true)}
                      sx={{ minWidth: 120, height: 40 }} // Set fixed width and height for stability
                    >
                      Delete Project
                    </Button>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    You are invited to this project
                  </Typography>
                )}
              </Stack>
            }
          />

          <ShareProjectDialog
            id={id}
            open={shareProjectDialogOpen}
            onClose={() => setShareProjectDialogOpen(false)}
            projectName={project.fields.name}
          />
          <DeleteProjectDialog
            open={deleteProjectDialogOpen}
            onClose={() => setDeleteProjectDialogOpen(false)}
            id={id}
            onDelete={() => {
              refreshProjects();
              clearCache();
            }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <ExperimentsTable
                project={project}
                experiments={experiments}
                addExperiment={addExperiment}
                fullTexts={fullTexts}
                totalFullTexts={totalFullTexts}
              />
            </Grid>
            <Grid item xs={6}>
              {experimentsLoading ? (
                <Skeleton animation={'wave'} />
              ) : (
                <PerformanceCard experiments={experiments} humanEvaluation={experiment_scores} />
              )}
            </Grid>
            <Grid item xs={6}>
              {experimentsLoading || surveysLoading ? (
                <Skeleton animation={'wave'} />
              ) : (
                <MySurveys
                  project={project}
                  surveys={surveys}
                  experiments={experiments}
                  setSurveys={setSurveys}
                />
              )}
            </Grid>
            <Grid item xs={6}>
              <HumanEvaluationDashboard
                experiment_scores={experiment_scores}
                loading={scoresLoading}
                refresh={refreshExperimentEvaluations}
              />
            </Grid>
            <Grid item xs={12}>
              <FullTextsList
                fullTexts={fullTexts}
                totalFullTexts={totalFullTexts}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                fetchFullTexts={fetchFullTexts}
              />
            </Grid>
          </Grid>
        </>
      )}
      <Outlet />
    </Box>
  );
}

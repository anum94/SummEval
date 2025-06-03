import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Box, Button, TextField, Typography } from '@mui/material';

import Toolbar from '../Global/Toolbar.jsx';
import SummaryTabs from './SummaryTabs.jsx';
import { SplashScreen } from '../Loading/index.js';
import axios, { endpoints } from '../../utils/axios.js';
import DeleteExperimentDialog from './DeleteExperimentDialog.jsx';

export default function ExperimentDetail() {
  const { experiment_id } = useParams();
  const location = useLocation();

  const [experiment, setExperiment] = useState(null);
  const [experimentLoading, setExperimentLoading] = useState(true);
  const [summaryEvaluations, setSummaryEvaluations] = useState();
  const [summaryEvaluationsLoading, setSummaryEvaluationsLoading] = useState(true);

  const [deleteExperimentDialogOpen, setDeleteExperimentDialogOpen] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [searchPage, setSearchPage] = useState('');
  const [hasPagination, setHasPagination] = useState(false);
  const [projectId, setProjectId] = useState();

  useEffect(() => {
    const locationExperiment = location.state?.experiment;
    if (
      locationExperiment &&
      String(locationExperiment.pk).trim() === String(experiment_id).trim()
    ) {
      setExperiment(locationExperiment);
      setHasPagination(locationExperiment.fields.supportsPagination || false);
      setExperimentLoading(false);
      setProjectId(locationExperiment.fields?.project);
    } else {
      const fetchExperiment = async () => {
        try {
          const response = await axios.get(
            `${endpoints.experiments.getById}?experiment=${experiment_id}`
          );
          const experimentData = response.data[0];

          const ownershipResponse = await axios.get(
            `${endpoints.experiments.getOwnership}?experiment=${experiment_id}`
          );

          const isOwner = ownershipResponse.data.isOwner;
          const updatedExperimentData = {
            ...experimentData,
            fields: {
              ...experimentData.fields,
              owner: isOwner,
            },
          };
          console.log('experiment data: ', updatedExperimentData);
          let isTherePagination = experimentData.fields?.summaries?.some((s) => s.fields.index !== undefined) || false

          setExperiment(updatedExperimentData);
          setHasPagination(isTherePagination);
          setProjectId(experimentData.fields?.project);
        } catch (error) {
          console.error('Error fetching experiment:', error);
        } finally {
          setExperimentLoading(false);
        }
      };
      fetchExperiment();
    }
  }, [experiment_id, location.state]);

  const fetchSummaries = async (page = 1) => {
    if (!experiment) return;

    try {
      setLoadingSummaries(true);

      const endpoint = hasPagination
        ? endpoints.experiments.getPaginatedSummaries
        : endpoints.experiments.getById;

      const response = await axios.get(endpoint, {
        params: { experiment: experiment_id, ...(hasPagination ? { page } : {}) },
      });

      if (hasPagination) {
        const { fields: { summaries = [] } = {}, total_count, page_size } = response.data;

        if (Array.isArray(summaries)) {
          const normalizedSummaries = summaries.map((summary) => ({
            pk: summary.pk,
            fields: { ...summary.fields },
          }));

          setSummaries(normalizedSummaries);
          // console.log("summries: ", summaries)

          // if (summaries) {
          //     summaries.forEach((summary, index) => {
          //       console.log(`Summary ${index + 1} data:`, summary);
          //     });
          //   }

          setTotalPages(Math.ceil(total_count / page_size)); // Calculate total pages
          //  console.log('Paginated Summaries: ', normalizedSummaries);
        } else {
          console.error('Invalid structure for paginated summaries:', summaries);
          setSummaries([]);
          setTotalPages(0);
        }
      } else {
        //  console.log('fetching data with no pages');
        const fetchedSummaries = response.data[0]?.fields?.summaries || [];
        setSummaries(fetchedSummaries);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    } finally {
      setLoadingSummaries(false);
    }
  };

  useEffect(() => {
    if (experiment) fetchSummaries(currentPage);
  }, [experiment, currentPage, hasPagination]);

  useEffect(() => {
    if (!experiment_id) return;

    const fetchEvaluations = async () => {
      try {
        setSummaryEvaluationsLoading(true);
        const response = await axios.get(`${endpoints.evaluation}?experiment=${experiment_id}`);
        setSummaryEvaluations(response.data);
      } catch (error) {
        console.error('Error fetching summary evaluations:', error);
      } finally {
        setSummaryEvaluationsLoading(false);
      }
    };

    fetchEvaluations();
  }, [experiment_id]);

  const generatePagination = (currentPage, totalPages) => {
    const visiblePages = 3; // Number of pages to show on each side of the current page
    const pagination = [];

    pagination.push(1);
    if (currentPage > visiblePages + 2) {
      pagination.push('...');
    }

    // Add pages around the current page
    for (
      let i = Math.max(2, currentPage - visiblePages);
      i <= Math.min(totalPages - 1, currentPage + visiblePages);
      i++
    ) {
      pagination.push(i);
    }

    if (currentPage < totalPages - visiblePages - 1) {
      pagination.push('...');
    }

    // Always show the last page
    if (totalPages > 1) {
      pagination.push(totalPages);
    }

    return pagination;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchPage = (e) => {
    e.preventDefault();
    const page = parseInt(searchPage, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSearchPage('');
    } else {
      alert('Invalid page number');
    }
  };

  if (experimentLoading || summaryEvaluationsLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <Toolbar
        title={experiment.fields.name}
        subtitles={[
          ['LLM name:', experiment.fields.llm_name],
          ['Context window:', experiment.fields.context_window],
          ['Max new tokens:', experiment.fields.max_new_tokens],
        ]}
        button={
          experiment.fields.owner ? (
            <Button
              variant="soft"
              color="error"
              onClick={() => setDeleteExperimentDialogOpen(true)}
            >
              Delete Experiment
            </Button>
          ) : (
            <Typography variant="body2" color="text.secondary">
              You are not the owner of this experiment
            </Typography>
          )
        }
      />
      <DeleteExperimentDialog
        open={deleteExperimentDialogOpen}
        onClose={() => setDeleteExperimentDialogOpen(false)}
        experiment_id={experiment_id}
        project_id={projectId}
      />

      {hasPagination && (
        <Box mt={1}>
          {loadingSummaries ? (
            <Typography>Loading summaries...</Typography>
          ) : (
            <Box>
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" alignItems="center" mt={1}>
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </Button>
                  {generatePagination(currentPage, totalPages).map((page, index) => (
                    <Button
                      key={index}
                      onClick={() => {
                        if (typeof page === 'number') handlePageChange(page);
                      }}
                      variant={page === currentPage ? 'contained' : 'outlined'}
                      disabled={page === '...'}
                    >
                      {page}
                    </Button>
                  ))}
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </Button>
                  <form onSubmit={handleSearchPage}>
                    <TextField
                      label="Enter index"
                      value={searchPage}
                      onChange={(e) => setSearchPage(e.target.value)}
                      type="number"
                      InputProps={{ inputProps: { min: 1, max: totalPages } }}
                      sx={{ ml: 2, width: 100 }}
                    />
                    <Button type="submit" variant="contained" sx={{ mt: 1, ml: 1 }}>
                      Go
                    </Button>
                  </form>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}

      <SummaryTabs
        experimentId={experiment_id}
        summaryData={summaries}
        humanEvaluations={summaryEvaluations}
        loading={loadingSummaries}
        hasPagination={hasPagination}
        currentPage={currentPage}
        onAddMetric={() => {
          if (experiment) {
            fetchSummaries(currentPage);
          }
        }}
      />
    </>
  );
}

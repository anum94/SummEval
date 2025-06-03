import { useState, useEffect, useCallback, useRef } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import axios from '../../utils/axios.js';

const TaskOverlay = ({ children, cacheKey, onPollingChange, onPollingComplete }) => {
  const [taskId, setTaskId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const pollIntervalInMilliseconds = 6500;

  const fetchTaskId = async () => {
    try {
      const response = await axios.get(`/api/tasks/from-cache/${cacheKey}`);
      if (response.status !== 200) throw new Error('No task found');

      return response.data.task_id;
    } catch (error) {
      console.error('Error fetching task ID:', error);
      return null;
    }
  };

  const fetchTaskStatus = async (taskId) => {
    try {
      const response = await axios.get(`/api/tasks/${taskId}/status`);
      if (response.status !== 200) throw new Error('Task not found');

      return response.data;
    } catch (error) {
      console.error('Error fetching task status:', error);

      if (loading) {
        setLoading(false);
      }
      if (onPollingChange) onPollingChange(false);
      return null;
    }
  };

  const startTask = useCallback(async () => {
    const id = await fetchTaskId();
    if (id) {
      setTaskId(id);
      setLoading(true);
      if (onPollingChange) onPollingChange(true);
    }
  }, [cacheKey, onPollingChange]);

  useEffect(() => {
    startTask();
  }, [startTask]);

  useEffect(() => {
    if (!taskId) return;

    const interval = setInterval(async () => {
      const status = await fetchTaskStatus(taskId);
      console.log('status: ', status);
      if (status) {
        if (['SUCCESS', 'FAILURE', 'PENDING'].includes(status.state)) {
          clearInterval(interval);
          setLoading(false);
          setTaskId(null);
          if (onPollingChange) onPollingChange(false);
          if (onPollingComplete) onPollingComplete(true);
        } else {
          setProgress(status.progress);
        }
      } else {
        clearInterval(interval);
        if (onPollingChange) onPollingChange(false);
      }
    }, pollIntervalInMilliseconds);

    return () => {
      clearInterval(interval);
      if (onPollingChange) onPollingChange(false);
    };
  }, [taskId, onPollingChange]);

  return (
    <Box className="relative w-full">
      <Box
        className={`relative w-full transition-opacity ${loading ? 'opacity-50 blur-md' : 'opacity-100'}`}
      >
        {children(startTask)}
      </Box>

      {loading && (
        <Box
          className="absolute inset-0 flex flex-col justify-center items-center bg-white bg-opacity-80"
          sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute',
            top: 0,
            left: 0,
            backdropFilter: 'blur(2px)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress color="primary" size={80} thickness={4} />
            <Typography
              variant="h6"
              sx={{
                mt: 1,
                px: 1.5,
                py: 0.5,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '4px',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {' '}
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TaskOverlay;

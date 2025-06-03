import axios from 'axios';

//axiosInstance: create axios instance with default configurations
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : 'http://localhost:8000',
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

// fetcher: fetch data from API using axios instance
export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// Endpoints: define API endpoints for axios requests
export const endpoints = {
  auth: {
    //me: '/api/auth/me',
    login: '/api/token/',
    register: '/api/register/',
    refreshToken: '/api/token/refresh/',
    changePassword: '/api/change-password/',
    updateUser: '/api/update-user/',
  },
  users: {
    search: '/api/users/search/',
  },
  projects: '/api/projects/',
  projectInvitations: {
    default: '/api/project-invitations/',
    updateStatus: '/api/project-invitations/update-status/',
  },
  experiments: {
    default: '/api/experiments/',
    getById: '/api/experiments/get-by-id/',
    summary: '/api/experiments/summary/',
    getPaginatedSummaries: '/api/experiments/get-paginated-summaries/',
    getOwnership: '/api/experiments/ownership/'
  },
  survey: {
    default: '/api/survey/',
    evaluations: '/api/survey/evaluations/',
  },
  summary: 'api/get-summaries-for-eval/',
  evaluation: '/api/evaluation/',
  fulltexts: '/api/fulltexts/',
  invitation: '/api/invitation/',
  fetchCorrelations: '/api/calculate-correlations/',
  autoEvaluation: '/api/auto-evaluation/',
  atomicFactsForParagraph: '/api/get-atomic-facts-for-paragraph/',
};
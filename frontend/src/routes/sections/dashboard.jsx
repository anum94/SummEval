import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from 'src/layouts/dashboard';
import { SplashScreen } from 'src/components/Loading';

import { AuthGuard } from 'src/auth/guard';
import { ProjectsProvider } from '../../ProjectsProvider.jsx';

const AllProjects = lazy(() => import('/src/components/Projects/AllProjects'));
const ExperimentDetails = lazy(() => import('/src/components/Experiments/ExperimentDetails'));
const ProjectDetails = lazy(() => import('/src/components/Projects/ProjectDetails'));
const SurveyDetails = lazy(() => import('/src/components/Surveys/SurveyDetails'));
const UserAccountPage = lazy(() => import('/src/pages/user/account'));
const Documentation = lazy(() => import('/src/components/Documentation/Documentation'));

// Dashboard routes
const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<SplashScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <ProjectsProvider>{layoutContent}</ProjectsProvider>
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <AllProjects />,
      },
      {
        path: 'project/:id',
        element: <ProjectDetails />,
        children: [
          {
            path: 'experiment/:experiment_id',
            element: <ExperimentDetails />,
          },
        ],
      },
      {
        path: 'survey/:survey_id',
        element: <SurveyDetails />,
      },
      {
        path: 'account',
        element: <UserAccountPage />,
      },
      {
        path: 'documentation',
        element: <Documentation />,
      },
    ],
  },
];

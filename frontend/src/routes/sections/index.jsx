import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

import { SimpleLayout } from '../../layouts/simple';
import { SplashScreen } from 'src/components/Loading';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';

const HomePage = lazy(() => import('/src/pages/home/home'));

// Export routes for the app
export const router = createBrowserRouter([
  {
    path: '/',
    /**
     * Skip home page
     * element: <Navigate to={CONFIG.auth.redirectPath} replace />,
     */
    element: (
      <Suspense fallback={<SplashScreen />}>
        <SimpleLayout>
          <HomePage />
        </SimpleLayout>
      </Suspense>
    ),
  },

  // Auth
  ...authRoutes,

  // Main
  ...mainRoutes,

  // Dashboard
  ...dashboardRoutes,

  // No match
  {
    path: '*',
    element: <Navigate to="/error/404" replace />,
  },
]);

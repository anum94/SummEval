import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { SimpleLayout } from '/src/layouts/simple';
import { BasicLayout } from '/src/layouts/basic';

import { SplashScreen } from 'src/components/Loading';
import { LoadingScreen } from 'src/components/Loading';

import { summaryLoader } from 'src/DataLoaders';

// using lazy loading for better code splitting and performance to load the page faster and reduce the bundle size of the app when the page is not visited by the user yet
const SummaryEvaluation = lazy(() => import('/src/components/SummaryEvaluation.jsx'));


// Error
const Page403 = lazy(() => import('src/pages/error/403'));
const Page404 = lazy(() => import('/src/pages/error/404'));
const Page500 = lazy(() => import('src/pages/error/500'));



// Main routes
export const mainRoutes = [
  {
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      {
        element: (
          <SimpleLayout>
            <Outlet />
          </SimpleLayout>
        ),
        children: [
          {
            //path: 'about',
            //element: <AboutPage />,
          },
          {
            path: '/summaryeval/:invite_id',
            element: <SummaryEvaluation />,
            loader: summaryLoader,
          },
        ],
      },
      {
        element: (
          <BasicLayout>
            <Outlet />
          </BasicLayout>
        ),
        path: 'error',
        children: [
          {
            path: '403',
            element: <Page403 />,
          },
          {
            path: '404',
            element: <Page404 />,
          },
          {
            path: '500',
            element: <Page500 />,
          },
        ],
      },
      { path: 'loading', element: <LoadingScreen /> },
      { path: 'splash', element: <SplashScreen /> },
    ],
  },
];

import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom'; // Outlet is a placeholder for child routes in the route configuration. It is used to render the child routes of a parent route.

import { AuthCenteredLayout } from '/src/layouts/authCentered';
import { SplashScreen } from 'src/components/Loading';

import { GuestGuard } from '/src/auth/guard';

const LoginPage = lazy(() => import('/src/pages/auth/jwt/login'));
const RegisterPage = lazy(() => import('/src/pages/auth//jwt/register'));

// Auth routes
const authJwt = {
  children: [
    {
      path: 'login',
      element: (
        <GuestGuard>
          <AuthCenteredLayout section={{ title: 'Welcome back!' }}>
            <LoginPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'register',
      element: (
        <GuestGuard>
          <AuthCenteredLayout>
            <RegisterPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
  ],
};

// Export auth routes
export const authRoutes = [
    {
      path: 'auth',
      element: (
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      ),
      children: [authJwt],
    },
  ];
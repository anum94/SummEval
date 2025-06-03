import { useState, useEffect } from 'react';

import { useRouter, useSearchParams } from '/src/routes/hooks';

import { paths } from '/src/routes/paths';

import { SplashScreen } from 'src/components/Loading';

import { useAuthContext } from '../hooks';


export function GuestGuard({ children }) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const { loading, authenticated } = useAuthContext();

  const [isChecking, setIsChecking] = useState(true);

  // Get returnTo from searchParams or to the dashboard
  const returnTo = searchParams.get('returnTo') || paths.dashboard.root

  // Check if user is authenticated or not
  const checkPermissions = async () => {
    if (loading) { // if loading is true, return
      return;
    }

    if (authenticated) { // if authenticated is true, redirect to returnTo
      router.replace(returnTo);
      return;
    }

    setIsChecking(false);
  };

  // Check permissions on initial render and retrun auth state changes 
  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading]);

  
  if (isChecking) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

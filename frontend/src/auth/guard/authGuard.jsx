import { useState, useEffect, useCallback } from 'react';

import { paths } from '/src/routes/paths';
import { useRouter, usePathname, useSearchParams } from '/src/routes/hooks';

import { SplashScreen } from 'src/components/Loading';

import { useAuthContext } from '../hooks';


export function AuthGuard({ children }) {
  const router = useRouter(); // useRouter is a custom hook that provides a simple API for navigating around the app. It wraps the useNavigate hook from react-router-dom and provides a more intuitive API for common navigation actions like back, forward, refresh, push, and replace.

  const pathname = usePathname(); // usePathname is a custom hook that provides the current pathname from the location object provided by react-router-dom. 

  const searchParams = useSearchParams(); // useSearchParams is a custom hook that provides the search params from the location object provided by react-router-dom. It avoids unnecessary re-renders of the component when the searchParams value does not change.

  const { authenticated, loading } = useAuthContext(); // useAuthContext is a custom hook that provides the authenticated state and loading state from the AuthProvider component. It is used to check if the user is authenticated and if the authentication process is in progress.

  const [isChecking, setIsChecking] = useState(true); // isChecking is a state variable that indicates whether the permissions are being checked. It is used to show a loading screen while the permissions are being checked.

  // createQueryString is a function that creates a query string with the given name and value. It is used to create a query string with the returnTo parameter to redirect the user to the original page after authentication.
  const createQueryString = useCallback(
    (name, value) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams]
  );

  const checkPermissions = async () => {
    if (loading) {
      return;
    }

    if (!authenticated) {
      const loginPath = paths.auth.jwt.login;
      const href = `${loginPath}?${createQueryString('returnTo', pathname)}`; //href is a string that contains the sign-in path with the returnTo query parameter set to the current pathname. It is used to redirect the user to the sign-in page with the returnTo parameter after authentication.

      router.replace(href); // replace the current page with the sign-in page
      return;
    }

    setIsChecking(false);
  };

  useEffect(() => {
    checkPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, loading]);

  
  if (isChecking) {
    return <SplashScreen />;
  }
  
  return <>{children}</>;
}
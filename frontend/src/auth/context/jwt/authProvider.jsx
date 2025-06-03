import { useMemo, useEffect, useCallback } from 'react';

import { useSetState } from '/src/hooks/use-set-state';

import { STORAGE_KEY, STORAGE_KEY_REFRESH } from './constant';
import { AuthContext } from '../authContext';
import { setSession, isValidToken, jwtDecode } from './utils';

// AuthProvider: provide authentication context to all child components
export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    loading: true,
  });

  // checkUserSession: check user session and update user state
  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(STORAGE_KEY); // get access token from session storage and not local storage to prevent XSS attacks
      const refreshToken = sessionStorage.getItem(STORAGE_KEY_REFRESH); // get refresh token from session storage


      if (accessToken && isValidToken(accessToken)) {
        await setSession(accessToken, refreshToken); // set session storage with access token if token is valid

        const decodedToken = jwtDecode(accessToken);

        const userFirstName = decodedToken.first_name;
        const userLastName = decodedToken.last_name;
        const userEmail = decodedToken.email;


        // update user state with user data and access token if user is authenticated
        setState({ user: { userFirstName, userLastName, userEmail, accessToken }, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated'; // check if user is authenticated or not based on user state

  const status = state.loading ? 'loading' : checkAuthenticated; // check if user is loading, authenticated, or unauthenticated based on loading state and checkAuthenticated

  // memoizedValue: memoize value to prevent unnecessary re-renders of child components when value is not changed 
  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            role: state.user?.role ?? 'admin', // set default role to admin if role is not provided in user data 
          }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );
  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}

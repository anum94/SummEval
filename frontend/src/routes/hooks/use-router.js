import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// useRouter is a custom hook that provides a simple API for navigating around the app. It wraps the useNavigate hook from react-router-dom and provides a more intuitive API for common navigation actions like back, forward, refresh, push, and replace.
export function useRouter() {
  const navigate = useNavigate();

  const router = useMemo(
    () => ({
      back: () => navigate(-1), //navigate to the previous page
      forward: () => navigate(1), // navigate to the next page
      refresh: () => navigate(0), // refresh the current page
      push: (href) => navigate(href), // navigate to a new page in the same tab
      replace: (href) => navigate(href, { replace: true }), // replace the current page with a new page in 
    }),
    [navigate]
  );

  return router;
}

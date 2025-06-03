import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// hook that scrolls to the top of the page on route change
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

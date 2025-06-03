import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';


// usePathname is a custom hook that provides the current pathname from the location object provided by react-router-dom. It is used to get the current pathname in the AuthGuard component.
export function usePathname() {
  const { pathname } = useLocation();

  return useMemo(() => pathname, [pathname]);
}

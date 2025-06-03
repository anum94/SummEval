import { useMemo } from 'react';
import { useSearchParams as _useSearchParams } from 'react-router-dom';


// useSearchParams is a custom hook that provides the search params from the location object provided by react-router-dom. It is used to get the search params in the AuthGuard component.
export function useSearchParams() {
  const [searchParams] = _useSearchParams();

  return useMemo(() => searchParams, [searchParams]); // useMemo is a React hook that memorizes the value of the searchParams variable. It is used to prevent unnecessary re-renders of the component when the searchParams value does not change.
}

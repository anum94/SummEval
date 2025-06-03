import { useMemo } from 'react';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// useResponsive is a custom hook that returns a boolean value based on the current window size and the media query provided.
export function useResponsive(query, start, end) {
  const theme = useTheme();
  // useMemo is a React hook that memorizes the output of a function and returns the cached result when the function is called with the same inputs.
  const getQuery = useMemo(() => {
    switch (query) {
      case 'up':
        return theme.breakpoints.up(start);
      case 'down':
        return theme.breakpoints.down(start);
      case 'between':
        return theme.breakpoints.between(start, end);
      case 'only':
        return theme.breakpoints.only(start);
      default:
        return theme.breakpoints.up('xs');
    }
  }, [theme, query, start, end]);

  // useMediaQuery is a hook that returns a boolean value based on the current window size and the media query provided.
  const mediaQueryResult = useMediaQuery(getQuery);

  return mediaQueryResult;
}


// useWidth is a custom hook that returns the current window size based on the theme breakpoints.
export function useWidth() {
  const theme = useTheme();

  // useMemo is a React hook that memorizes the output of a function and returns the cached result when the function is called with the same inputs.
  const keys = useMemo(() => [...theme.breakpoints.keys].reverse(), [theme]);

  // reduce is a JavaScript array method that reduces an array to a single value.
  const width = keys.reduce((output, key) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const matches = useMediaQuery(theme.breakpoints.up(key));

    return !output && matches ? key : output;
  }, null);

  // Return the current window size based on the theme breakpoints or 'xs' if no match is found.
  return width || 'xs';
}

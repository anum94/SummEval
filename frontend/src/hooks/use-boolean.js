import { useMemo, useState, useCallback } from 'react';

// useBoolean hook returns an object with the following properties: value, onTrue, onFalse, onToggle, setValue. Used to manage boolean state and provide utility functions to update it.
export function useBoolean(defaultValue = false) {
  const [value, setValue] = useState(defaultValue);

  const onTrue = useCallback(() => {
    setValue(true);
  }, []);

  const onFalse = useCallback(() => {
    setValue(false);
  }, []);

  const onToggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const memoizedValue = useMemo(
    () => ({
      value,
      onTrue,
      onFalse,
      onToggle,
      setValue,
    }),
    [value, onTrue, onFalse, onToggle, setValue]
  );

  return memoizedValue;
}

import { useMemo, useState, useEffect, useCallback } from 'react';

import { isEqual } from 'src/utils/helper';
import { localStorageGetItem } from 'src/utils/storage-available';


// Hook to use local storage with a key and initial state value
export function useLocalStorage(key, initialState) {
  const [state, set] = useState(initialState);

  const multiValue = initialState && typeof initialState === 'object';

  const canReset = !isEqual(state, initialState);

  useEffect(() => {
    const restoredValue = getStorage(key);

    if (restoredValue) {
      if (multiValue) {
        set((prevValue) => ({ ...prevValue, ...restoredValue }));
      } else {
        set(restoredValue);
      }
    }
  }, [key, multiValue]);

  const setState = useCallback(
    (updateState) => {
      if (multiValue) {
        set((prevValue) => {
          setStorage(key, { ...prevValue, ...updateState });
          return { ...prevValue, ...updateState };
        });
      } else {
        setStorage(key, updateState);
        set(updateState);
      }
    },
    [key, multiValue]
  );

  const setField = useCallback(
    (name, updateValue) => {
      if (multiValue) {
        setState({
          [name]: updateValue,
        });
      }
    },
    [multiValue, setState]
  );

  const resetState = useCallback(() => {
    set(initialState);
    removeStorage(key);
  }, [initialState, key]);

  const memoizedValue = useMemo(
    () => ({
      state,
      setState,
      setField,
      resetState,
      canReset,
    }),
    [canReset, resetState, setField, setState, state]
  );

  return memoizedValue;
}


// Get value from local storage by key and parse it to JSON if it exists
export function getStorage(key) {
  try {
    const result = localStorageGetItem(key);

    if (result) {
      return JSON.parse(result);
    }
  } catch (error) {
    console.error('Error while getting from storage:', error);
  }

  return null;
}


// Set key and value to local storage
export function setStorage(key, value) {
  try {
    const serializedValue = JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error('Error while setting storage:', error);
  }
}

// Remove key from local storage if it exists
export function removeStorage(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error('Error while removing from storage:', error);
  }
}

import { useMemo, useState, useCallback } from 'react';

import { isEqual } from '/src/utils/helper';


// useSetState is a custom hook that provides a state object and methods to update the state object. It is used to manage the state of the AuthProvider component.
export function useSetState(initialState) {
  const [state, set] = useState(initialState); // useState is a React hook that returns a stateful value and a function to update it. It is used to create a state object with the initial state provided as an argument.

  const canReset = !isEqual(state, initialState); // isEqual is a helper function that compares two objects for equality. It is used to determine if the state object can be reset to the initial state.

  const setState = useCallback((updateState) => { // useCallback is a React hook that memoizes a function. It is used to memoize the setState function to prevent unnecessary re-renders of the component.
    set((prevValue) => ({ ...prevValue, ...updateState })); // set is a function returned by the useState hook that updates the state object with the new values provided as an argument.
  }, []);

  // setField is a function that updates a specific field in the state object. It is used to update a specific field in the state object.
  const setField = useCallback(
    (name, updateValue) => {
      setState({
        [name]: updateValue,
      });
    },
    [setState]
  );

  // onResetState is a function that resets the state object to the initial state. It is used to reset the state object to the initial state.
  const onResetState = useCallback(() => {
    set(initialState);
  }, [initialState]);

  // memoizedValue: memorize value to prevent unnecessary re-renders of child components when value is not changed
  const memoizedValue = useMemo(
    () => ({
      state,
      setState,
      setField,
      onResetState,
      canReset,
    }),
    [canReset, onResetState, setField, setState, state]
  );

  return memoizedValue;
}
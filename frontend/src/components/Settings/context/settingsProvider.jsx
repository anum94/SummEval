import { useMemo, createContext } from 'react';

import { useLocalStorage } from 'src/hooks/use-local-storage';

import { STORAGE_KEY } from '../config-settings';


// SettingsContext is used to provide the settings to the components to store light/dark mode, compact layout, etc.
export const SettingsContext = createContext(undefined);

// SettingsConsumer is used to consume the settings from the context, so that the components can access the settings.
export const SettingsConsumer = SettingsContext.Consumer;


export function SettingsProvider({ children, settings }) {
  const values = useLocalStorage(STORAGE_KEY, settings);


  const memoizedValue = useMemo(
    () => ({
        ...values.state,
        canReset: values.canReset,
        onReset: values.resetState,
        onUpdate: values.setState,
        onUpdateField: values.setField,
    }),
    [
        values.canReset,
        values.resetState,
        values.setField,
        values.setState,
        values.state,
    ]
  );

  return <SettingsContext.Provider value={memoizedValue}>{children}</SettingsContext.Provider>;
}

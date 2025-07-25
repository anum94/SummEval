import { useContext } from 'react';

import { SettingsContext } from './settingsProvider';

// Return the settings context
export function useSettingsContext() {
  const context = useContext(SettingsContext);

  if (!context) throw new Error('useSettingsContext must be use inside SettingsProvider');

  return context;
}

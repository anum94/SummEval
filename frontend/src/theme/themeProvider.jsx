import CssBaseline from '@mui/material/CssBaseline';
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { useSettingsContext } from 'src/components/Settings';
import { createTheme } from './createTheme';


export function ThemeProvider({ children }) {

  // Here we could add a language provider to change the language of the app or a settings provider to change the settings. Both would need to be added to the theme provider.
  const settings = useSettingsContext();

  // Create the theme with the current settings
  const theme = createTheme(settings);

  // Return CssVarsProvider with theme and settings, CssBaseline for global styles
  return (
    <CssVarsProvider
      theme={theme}
      defaultMode={'light'}
      modeStorageKey={'theme-mode'}
    >
      <CssBaseline />
      {children}
    </CssVarsProvider>
  );
}
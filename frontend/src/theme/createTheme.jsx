import { experimental_extendTheme as extendTheme } from '@mui/material/styles';
import { shadows, typography, colorSchemes, customShadows, components} from './core';
import { updateCoreWithSettings, updateComponentsWithSettings } from './updateTheme';

// Override the default theme with the settings
export function createTheme(settings) {
  const initialTheme = {
    colorSchemes,
    shadows: shadows(settings.colorScheme),
    customShadows: customShadows(settings.colorScheme),
    shape: { borderRadius: 8 },
    components,
    typography: {
      ...typography,
    },
    cssVarPrefix: '', // Prefix for CSS variables (when using `cssVar` function) in the theme
    shouldSkipGeneratingVar,
  };

  const updateTheme = updateCoreWithSettings(initialTheme, settings); // update the theme with the settings

  const theme = extendTheme(updateTheme, updateComponentsWithSettings(settings),); // extend the theme with the updated theme and the updated components

  return theme;
}


// shouldSkipGeneratingVar function is used to skip generating CSS variables for some keys to reduce the size of the generated CSS.
function shouldSkipGeneratingVar(keys, value) {
  const skipGlobalKeys = [
    'mixins',
    'overlays',
    'direction',
    'breakpoints',
    'cssVarPrefix',
    'unstable_sxConfig',
    'typography',
    // 'transitions',
  ];

  const skipPaletteKeys = {
    global: ['tonalOffset', 'dividerChannel', 'contrastThreshold'],
    grey: ['A100', 'A200', 'A400', 'A700'],
    text: ['icon'],
  };

  const isPaletteKey = keys[0] === 'palette';

  // If the key is a palette key, check if it should be skipped
  if (isPaletteKey) {
    const paletteType = keys[1]; //keys at 1 index is the palette type
    const skipKeys = skipPaletteKeys[paletteType] || skipPaletteKeys.global; // skip global keys if no specific keys are defined

    return keys.some((key) => skipKeys?.includes(key)); // check if any of the keys should be skipped with some function (if any key is in the skipKeys array)
  }

  return keys.some((key) => skipGlobalKeys?.includes(key));
}
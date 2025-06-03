import COLORS from './core/colors.json';
import { components as coreComponents } from './core/components';
import { hexToRgbChannel, createPaletteChannel } from './styles';
import { grey as coreGreyPalette, primary as corePrimaryPalette } from './core/palette';
import { createShadowColor, customShadows as coreCustomShadows } from './core/customShadows';


/**
 * [1] settings @primaryColor
 * [2] settings @contrast
 */

// Update theme with settings from defualtSettings in config-settings.js
export function updateCoreWithSettings(theme, settings) {
  const { colorSchemes, customShadows } = theme;

  return {
    ...theme,
    colorSchemes: {
      ...colorSchemes,
      light: {
        palette: {
          ...colorSchemes?.light?.palette,
          /** [1] */
          primary: getPalettePrimary(settings.primaryColor),
          /** [2] */
          background: {
            ...colorSchemes?.light?.palette?.background,
            default: getBackgroundDefault(settings.contrast),
            defaultChannel: hexToRgbChannel(getBackgroundDefault(settings.contrast)),
          },
        },
      },
      dark: {
        palette: {
          ...colorSchemes?.dark?.palette,
          /** [1] */
          primary: getPalettePrimary(settings.primaryColor),
        },
      },
    },
    customShadows: {
      ...customShadows,
      /** [1] */
      primary:
        settings.primaryColor === 'default'
          ? coreCustomShadows('light').primary
          : createShadowColor(getPalettePrimary(settings.primaryColor).mainChannel),
    },
  };
}

// Update components with settings from defualtSettings in config-settings.js
export function updateComponentsWithSettings(settings) {
  const components = {};

  /** [2] */
  if (settings.contrast === 'hight') {
    const MuiCard = {
      styleOverrides: {
        root: ({ theme, ownerState }) => {
          let rootStyles = {};
          if (typeof coreComponents?.MuiCard?.styleOverrides?.root === 'function') {
            rootStyles =
              coreComponents.MuiCard.styleOverrides.root({
                ownerState,
                theme,
              }) ?? {};
          }

          return {
            ...rootStyles,
            boxShadow: theme.customShadows.z1,
          };
        },
      },
    };

    components.MuiCard = MuiCard;
  }

  return { components };
}


const PRIMARY_COLORS = {
  default: COLORS.primary
};

// Get the primary palette with the selected primary color
function getPalettePrimary(primaryColorName) {
  /** [1] */
  const selectedPrimaryColor = PRIMARY_COLORS[primaryColorName];
  const updatedPrimaryPalette = createPaletteChannel(selectedPrimaryColor);

  return primaryColorName === 'default' ? corePrimaryPalette : updatedPrimaryPalette;
}

// Get the background color with the selected contrast
function getBackgroundDefault(contrast) {
  /** [2] */
  return contrast === 'default' ? '#F5F5F5' : coreGreyPalette[200];
}

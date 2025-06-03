import COLORS from './colors.json';
import { varAlpha, createPaletteChannel } from '../styles';

// Grey
export const grey = createPaletteChannel(COLORS.grey);

// Primary
export const primary = createPaletteChannel(COLORS.primary);

// Secondary
export const secondary = createPaletteChannel(COLORS.secondary);

// Info
export const info = createPaletteChannel(COLORS.info);

// Success
export const success = createPaletteChannel(COLORS.success);

// Warning
export const warning = createPaletteChannel(COLORS.warning);

// Error
export const error = createPaletteChannel(COLORS.error);

// Common
export const common = createPaletteChannel(COLORS.common);

// Text - Light & Dark
export const text = {
  light: createPaletteChannel({
    primary: grey[800],
    secondary: grey[600],
    disabled: grey[500],
  }),
  dark: createPaletteChannel({
    primary: '#F5F5F5',
    secondary: grey[500],
    disabled: grey[600],
  }),
};

// Background - Light & Dark
export const background = {
  light: createPaletteChannel({
    paper: '#F5F5F5',
    default: '#F5F5F5',
    neutral: grey[200],
  }),
  dark: createPaletteChannel({
    paper: grey[800],
    default: grey[900],
    neutral: '#28323D',
  }),
};

// Action - Base palette for hover, selected, focus, disabled states & opacity 
export const baseAction = {
  hover: varAlpha(grey['500Channel'], 0.08),
  selected: varAlpha(grey['500Channel'], 0.16),
  focus: varAlpha(grey['500Channel'], 0.24),
  disabled: varAlpha(grey['500Channel'], 0.8),
  disabledBackground: varAlpha(grey['500Channel'], 0.24),
  hoverOpacity: 0.08,
  disabledOpacity: 0.48,
};

// Action - Light & Dark
export const action = {
  light: { ...baseAction, active: grey[600] },
  dark: { ...baseAction, active: grey[500] },
};


// Base palette
export const basePalette = {
  primary,
  secondary,
  info,
  success,
  warning,
  error,
  grey,
  common,
  divider: varAlpha(grey['500Channel'], 0.2),
  action,
};

// Light palette
export const lightPalette = {
  ...basePalette,
  text: text.light,
  background: background.light,
  action: action.light,
};

// Dark palette
export const darkPalette = {
  ...basePalette,
  text: text.dark,
  background: background.dark,
  action: action.dark,
};

// Color schemes
export const colorSchemes = {
  light: { palette: lightPalette },
  dark: { palette: darkPalette },
};

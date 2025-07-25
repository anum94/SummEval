import { varAlpha } from '../styles';
import { grey, info, error, common, primary, success, warning, secondary } from './palette';


// Shadow color for the shadow of the component based on the color channel
export function createShadowColor(colorChannel) {
  return `0 8px 16px 0 ${varAlpha(colorChannel, 0.24)}`;
}

// Custom shadows for the application based on the color scheme (light/dark)
export function customShadows(colorScheme) {
  const colorChannel = colorScheme === 'light' ? grey['500Channel'] : common.blackChannel;

  return {
    z1: `0 1px 2px 0 ${varAlpha(colorChannel, 0.16)}`,
    z4: `0 4px 8px 0 ${varAlpha(colorChannel, 0.16)}`,
    z8: `0 8px 16px 0 ${varAlpha(colorChannel, 0.16)}`,
    z12: `0 12px 24px -4px ${varAlpha(colorChannel, 0.16)}`,
    z16: `0 16px 32px -4px ${varAlpha(colorChannel, 0.16)}`,
    z20: `0 20px 40px -4px ${varAlpha(colorChannel, 0.16)}`,
    z24: `0 24px 48px 0 ${varAlpha(colorChannel, 0.16)}`,
    //
    dialog: `-40px 40px 80px -8px ${varAlpha(common.blackChannel, 0.24)}`,
    card: `0 0 2px 0 ${varAlpha(
      colorChannel,
      0.2
    )}, 0 12px 24px -4px ${varAlpha(colorChannel, 0.12)}`,
    dropdown: `0 0 2px 0 ${varAlpha(
      colorChannel,
      0.24
    )}, -20px 20px 40px -4px ${varAlpha(colorChannel, 0.24)}`,
    //
    primary: createShadowColor(primary.mainChannel),
    secondary: createShadowColor(secondary.mainChannel),
    info: createShadowColor(info.mainChannel),
    success: createShadowColor(success.mainChannel),
    warning: createShadowColor(warning.mainChannel),
    error: createShadowColor(error.mainChannel),
  };
}
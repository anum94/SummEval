import { varAlpha } from 'src/theme/styles';


export const bulletColor = {
  dark: '#282F37',
  light: '#EDEFF2',
};

function colorVars(theme, variant) {
  const {
    vars: { palette },
  } = theme;

  return {
    '--nav-item-color': palette.text.secondary,
    '--nav-item-hover-bg': palette.action.hover,
    '--nav-item-caption-color': palette.text.disabled,
    // root
    '--nav-item-root-active-color': palette.primary.main,
    '--nav-item-root-active-color-on-dark': palette.primary.light,
    '--nav-item-root-active-bg': varAlpha(palette.primary.mainChannel, 0.08),
    '--nav-item-root-active-hover-bg': varAlpha(palette.primary.mainChannel, 0.16),
    '--nav-item-root-open-color': palette.text.primary,
    '--nav-item-root-open-bg': palette.action.hover,
    // sub
    '--nav-item-sub-active-color': palette.text.primary,
    '--nav-item-sub-active-bg': palette.action.selected,
    '--nav-item-sub-open-color': palette.text.primary,
    '--nav-item-sub-open-bg': palette.action.hover,
    ...(variant === 'vertical' && {
      '--nav-item-sub-active-bg': palette.action.hover,
      '--nav-subheader-color': palette.text.disabled,
      '--nav-subheader-hover-color': palette.text.primary,
    }),
  };
}

function verticalVars(theme) {
  const { shape, spacing } = theme;

  return {
    ...colorVars(theme, 'vertical'),
    '--nav-item-gap': spacing(0.5),
    '--nav-item-radius': `${shape.borderRadius}px`,
    '--nav-item-pt': spacing(0.5),
    '--nav-item-pr': spacing(1),
    '--nav-item-pb': spacing(0.5),
    '--nav-item-pl': spacing(1.5),
    // root
    '--nav-item-root-height': '44px',
    // sub
    '--nav-item-sub-height': '36px',
    // icon
    '--nav-icon-size': '24px',
    '--nav-icon-margin': spacing(0, 1.5, 0, 0),
    // bullet
    '--nav-bullet-size': '12px',
    '--nav-bullet-light-color': bulletColor.light,
    '--nav-bullet-dark-color': bulletColor.dark,
  };
}


export const navSectionCssVars = {
  vertical: verticalVars,
};

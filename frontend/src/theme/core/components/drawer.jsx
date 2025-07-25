import { paper, varAlpha, stylesMode } from '../../styles';


// Overriding the default MuiDrawer style
const MuiDrawer = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paperAnchorRight: ({ ownerState, theme }) => ({
      ...(ownerState.variant === 'temporary' && {
        ...paper({ theme }),
        boxShadow: `-40px 40px 80px -8px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
        [stylesMode.dark]: {
          boxShadow: `-40px 40px 80px -8px ${varAlpha(theme.vars.palette.common.blackChannel, 0.24)}`,
        },
      }),
    }),
    paperAnchorLeft: ({ ownerState, theme }) => ({
      ...(ownerState.variant === 'temporary' && {
        ...paper({ theme }),
        boxShadow: `40px 40px 80px -8px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
        [stylesMode.dark]: {
          boxShadow: `40px 40px 80px -8px  ${varAlpha(theme.vars.palette.common.blackChannel, 0.24)}`,
        },
      }),
    }),
  },
};



export const drawer = { MuiDrawer };

import { varAlpha } from '../../styles';


// Overriding the default MuiBackdrop style
const MuiBackdrop = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: ({ theme }) => ({
      backgroundColor: varAlpha(theme.vars.palette.grey['800Channel'], 0.48),
    }),
    invisible: { background: 'transparent' },
  },
};


export const backdrop = { MuiBackdrop };

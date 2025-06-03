import { varAlpha } from '../../styles';


// Overriding the default MuiPaper style
const MuiPaper = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { elevation: 0 },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    root: { backgroundImage: 'none' },
    outlined: ({ theme }) => ({
      borderColor: varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
    }),
  },
};

// ----------------------------------------------------------------------

export const paper = { MuiPaper };

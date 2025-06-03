
// Override Material-UI's AppBar component
const MuiAppBar = {
  /** **************************************
   * DEFAULT PROPS
   *************************************** */
  defaultProps: { color: 'transparent' },

  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: { boxShadow: 'none' } },
};


export const appBar = { MuiAppBar };

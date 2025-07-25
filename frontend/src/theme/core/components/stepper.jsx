// Override Material-UI Stepper components
const MuiStepConnector = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { line: ({ theme }) => ({ borderColor: theme.vars.palette.divider }) },
};


export const stepper = { MuiStepConnector };

import { listClasses } from '@mui/material/List';

import { paper } from '../../styles';


// Overriding the default MuiPopover style
const MuiPopover = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    paper: ({ theme }) => ({
      ...paper({ theme, dropdown: true }),
      [`& .${listClasses.root}`]: { paddingTop: 0, paddingBottom: 0 },
    }),
  },
};


export const popover = { MuiPopover };

import { menuItem } from '../../styles';


// Overriding the default MuiMenuItem style
const MuiMenuItem = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: { root: ({ theme }) => ({ ...menuItem(theme) }) },
};


export const menu = { MuiMenuItem };

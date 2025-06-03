// Override Material-UI TreeView component style
const MuiTreeItem = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    label: ({ theme }) => ({ ...theme.typography.body2 }),
    iconContainer: { width: 'auto' },
  },
};



export const treeView = { MuiTreeItem };

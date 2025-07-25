// Override Material-UI Breadcrumbs component
const MuiBreadcrumbs = {
  /** **************************************
   * STYLE
   *************************************** */
  styleOverrides: {
    ol: ({ theme }) => ({ rowGap: theme.spacing(0.5), columnGap: theme.spacing(2) }),

    li: ({ theme }) => ({ display: 'inline-flex', '& > *': { ...theme.typography.body2 } }),
    separator: { margin: 0 },
  },
};



export const breadcrumbs = { MuiBreadcrumbs };

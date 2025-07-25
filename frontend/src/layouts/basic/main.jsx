import Box from '@mui/material/Box';

import { layoutClasses } from '../classes';

export function CompactContent({ children, sx, ...other }) {
  return (
    <Box
      className={layoutClasses.content}
      sx={{
        width: 1,
        mx: 'auto',
        display: 'flex',
        flex: '1 1 auto',
        textAlign: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        py: { xs: 5, md: 10, lg: 12 },
        maxWidth: 'var(--layout-simple-content-compact-width)',
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

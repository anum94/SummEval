import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { varAlpha } from 'src/theme/styles';

import { Logo } from '/src/components/Logo';
import { Scrollbar } from 'src/components/Scrollbar';

import { NavSectionVertical } from 'src/components/Nav-Section';
import { NavUpgrade } from '../components/nav-upgrade';

export function NavVertical({ sx, data, slots, layoutQuery, ...other }) {
  const theme = useTheme();

  const renderNavVertical = (
    <>
      {slots?.topArea ?? (
        <Box sx={{ pl: 3.5, pt: 2.5, pb: 1 }}>
          <Logo />
        </Box>
      )}

      <Scrollbar fillContent>
        <NavSectionVertical data={data} sx={{ px: 2, flex: '1 1 auto' }} {...other} />

        {slots?.bottomArea ?? <NavUpgrade />}
      </Scrollbar>
    </>
  );

  return (
    <Box
      sx={{
        top: 0,
        left: 0,
        height: 1,
        display: 'none',
        position: 'fixed',
        flexDirection: 'column',
        bgcolor: 'var(--layout-nav-bg)',
        zIndex: 'var(--layout-nav-zIndex)',
        width: 'var(--layout-nav-vertical-width)',
        borderRight: `1px solid var(--layout-nav-border-color, ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)})`,
        transition: theme.transitions.create(['width'], {
          easing: 'var(--layout-transition-easing)',
          duration: 'var(--layout-transition-duration)',
        }),
        [theme.breakpoints.up(layoutQuery)]: {
          display: 'flex',
        },
        ...sx,
      }}
    >
      {renderNavVertical}
    </Box>
  );
}

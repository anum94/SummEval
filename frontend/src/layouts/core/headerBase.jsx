import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';

import { paths } from '/src/routes/paths';
import { RouterLink } from '/src/routes/components';

import { Logo } from '/src/components/Logo';
//import { Circle } from '/src/components/Logo';

import { HeaderSection } from './headerSection';
import { ColorButton } from '../components/color-button';

import Box from '@mui/material/Box';

const StyledDivider = styled('span')(({ theme }) => ({
  width: 1,
  height: 10,
  flexShrink: 0,
  display: 'none',
  position: 'relative',
  alignItems: 'center',
  flexDirection: 'column',
  marginLeft: theme.spacing(2.5),
  marginRight: theme.spacing(2.5),
  backgroundColor: 'currentColor',
  color: theme.vars.palette.divider,
  '&::before, &::after': {
    top: -5,
    width: 3,
    height: 3,
    content: '""',
    flexShrink: 0,
    borderRadius: '50%',
    position: 'absolute',
    backgroundColor: 'currentColor',
  },
  '&::after': { bottom: -5, top: 'auto' },
}));

// Define the HeaderBase component
export function HeaderBase({
  sx,
  data,
  slots,
  slotProps,
  layoutQuery,

  slotsDisplay: {
    logo = true,
    helpLink = true,
    colorMode = true,

  } = {},

  ...other
}) {

    const theme = useTheme();

  return (
    <HeaderSection
      sx={sx}
      layoutQuery={layoutQuery}
      slots={{
        ...slots,
        leftAreaStart: slots?.leftAreaStart,
        leftArea: (
          <>
            {slots?.leftAreaStart}

            {/* -- Logo -- */}
            {logo && <Logo data-slot="logo"/>}

            {/* -- Divider -- */}
            <StyledDivider data-slot="divider" />

            {slots?.leftAreaEnd}
          </>
        ),
        rightArea: (
          <>
            {slots?.rightAreaStart}

            <Box
              data-area="right"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 1.5 },
              }}
            >
              {/* -- Help link -- */}
              {helpLink && (
                <Link
                  data-slot="help-link"
                  href={paths.feedback}
                  component={RouterLink}
                  color="inherit"
                  target="_blank"
                  sx={{ typography: 'subtitle2' }}
                >
                  What can be improved?
                </Link>
              )}

              {/* -- ColorMode button -- */}
              {colorMode && <ColorButton data-slot="colorMode" />}
            
            </Box>
            {slots?.rightAreaEnd}
          </>
        ),
      }}
      slotProps={slotProps}
      {...other}
    />
  );
}
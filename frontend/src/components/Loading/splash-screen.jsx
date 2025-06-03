import Box from '@mui/material/Box';
import Portal from '@mui/material/Portal';

import { AnimateLogo } from './animate-logo';


// Returns the splash screen with the animated SummEval logo.
export function SplashScreen({ portal = true, sx, ...other }) {
  const content = (
    <Box sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          right: 0,
          width: 1,
          bottom: 0,
          height: 1,
          display: 'flex',
          position: 'fixed',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          ...sx,
        }}
        {...other}
      >
        <AnimateLogo />
      </Box>
    </Box>
  );

  if (portal) {
    return <Portal>{content}</Portal>;
  }

  return content;
}

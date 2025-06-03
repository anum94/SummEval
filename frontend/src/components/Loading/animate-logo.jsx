import { m } from 'framer-motion';

import Box from '@mui/material/Box';

import { varAlpha } from 'src/theme/styles';

import { Circle } from '../Logo';

// Animate the SummEval logo for loading screen
export function AnimateLogo({ logo, sx, ...other }) {
  return (
    <Box
      sx={{
        width: 120,
        height: 120,
        alignItems: 'center',
        position: 'relative',
        display: 'inline-flex',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      <Box
        component={m.div}
        animate={{ 
          scale: [1, 0.9, 0.9, 1, 1], 
          opacity: [1, 0.48, 0.48, 1, 1],
          rotate: [0, 0, 270, 270, 0], }} // rotate from framer-motion [a, b, c, d, e] => a: initial, b: animate, c: exit, d: hover, e: tap
        transition={{
          duration: 2,
          repeatDelay: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        sx={{ display: 'inline-flex' }}
      >
        {logo ?? <Circle disableLink width={64} height={64} />}
      </Box>

      <Box
        component={m.div}
        animate={{
          scale: [1.6, 1, 1, 1.6, 1.6],
          opacity: [0.25, 1, 1, 1, 0.25],
          borderRadius: ['50%', '50%', '50%', '50%', '50%'],
        }}
        transition={{ ease: 'linear', duration: 3.2, repeat: Infinity }}
        sx={{
          position: 'absolute',
          width: 'calc(100% - 20px)',
          height: 'calc(100% - 20px)',
          border: (theme) => `solid 3px ${varAlpha(theme.vars.palette.primary.darkChannel, 0.24)}`,
        }}
      />
      <Box
        component={m.div}
        animate={{
          scale: [1, 1.2, 1.2, 1, 1],
          opacity: [1, 0.25, 0.25, 0.25, 1],
          borderRadius: ['50%', '50%', '50%', '50%', '50%'],
        }}
        transition={{ ease: 'linear', duration: 3.2, repeat: Infinity }}
        sx={{
          width: 1,
          height: 1,
          position: 'absolute',
          border: (theme) => `solid 8px ${varAlpha(theme.vars.palette.primary.darkChannel, 0.24)}`,
        }}
      />
    </Box>
  );
}
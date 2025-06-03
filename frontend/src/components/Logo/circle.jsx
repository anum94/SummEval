import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import NoSsr from '@mui/material/NoSsr';
import { useTheme } from '@mui/material/styles';

import { RouterLink } from '/src/routes/components';

import { logoClasses } from './classes';

// SummEval Circle logo
export const Circle = forwardRef(
  ({ width = 40, height = 40, disableLink = false, className, href = '/', sx, ...other }, ref) => {
    const theme = useTheme();

    const PRIMARY_MAIN = theme.vars.palette.primary.main;
    

    const logo = (
        <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <ellipse
            fill="none"
            stroke={PRIMARY_MAIN}
            strokeWidth="15px"
            cx="250"
            cy="250"
            rx="220"
            ry="220"
          />
          <rect
            x="-277.365"
            y="-447.493"
            width="280"
            height="280"
            fill="none"
            stroke={PRIMARY_MAIN}
            strokeWidth="15px" 
            //transform-origin= "-218.669px -384.698px"
            transform-origin="-195px -325px"
            transform="matrix(-0.707107007504, -0.707107007504, 0.707107007504, -0.707107007504, 471.917121633546, 626.522637535992)"
          />
        </svg>
      );


    return (
      <NoSsr
        fallback={
          <Box
            width={width}
            height={height}
            className={logoClasses.root.concat(className ? ` ${className}` : '')}
            sx={{
              flexShrink: 0,
              display: 'inline-flex',
              verticalAlign: 'middle',
              ...sx,
            }}
          />
        }
      >
        <Box
          ref={ref}
          component={RouterLink}
          href={href}
          width={width}
          height={height}
          className={logoClasses.root.concat(className ? ` ${className}` : '')}
          aria-label="logo"
          sx={{
            flexShrink: 0,
            display: 'inline-flex',
            verticalAlign: 'middle',
            ...(disableLink && { pointerEvents: 'none' }),
            ...sx,
          }}
          {...other}
        >
          {logo}
        </Box>
      </NoSsr>
    );
  }
);

/*
<svg viewBox="0 0 500 500" width="500" height="500" xmlns="http://www.w3.org/2000/svg">
  <ellipse style="fill: rgba(216, 216, 216, 0); stroke: rgb(27, 160, 152); vector-effect: non-scaling-stroke; stroke-width: 20px;" cx="250" cy="250" rx="236.422" ry="236.423" transform="matrix(1, 0, 0, 1, 1.4210854715202004e-14, 0)"/>
  <rect x="-797.227" y="-1286.222" width="317.391" height="317.391" style="fill: rgba(255, 255, 255, 0); stroke: rgb(27, 160, 152); vector-effect: non-scaling-stroke; stroke-width: 20px; transform-origin: -628.518px -1105.73px;" transform="matrix(-0.707107007504, -0.707107007504, 0.707107007504, -0.707107007504, 886.847778002786, 1333.239495238398)"/>
</svg>
*/
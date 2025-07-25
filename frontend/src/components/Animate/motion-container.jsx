import { m } from 'framer-motion';
import { forwardRef } from 'react';

import Box from '@mui/material/Box';

import { varContainer } from './Variants';

// Motion Container for framer motion animation: https://www.framer.com/api/motion/
export const MotionContainer = forwardRef(
  ({ animate, action = false, children, ...other }, ref) => {
    const commonProps = {
      ref,
      component: m.div,
      variants: varContainer(),
      initial: action ? false : 'initial',
      animate: action ? (animate ? 'animate' : 'exit') : 'animate',
      exit: action ? undefined : 'exit',
      ...other,
    };

    return <Box {...commonProps}>{children}</Box>;
  }
);
import { useRef, useState } from 'react';
import { m, useScroll, useSpring, useTransform, useMotionValueEvent } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from '/src/routes/paths';

import { useResponsive } from '/src/hooks/use-responsive';

import { TypeAnimation } from "react-type-animation";

import { varFade, MotionContainer } from '/src/components/Animate';


const smKey = 'sm';
const mdKey = 'md';
const lgKey = 'lg';

export function HomeHero({ sx, ...other }) {
  const theme = useTheme();

  const scroll = useScrollPercent();

  const mdUp = useResponsive('up', mdKey);

  const distance = mdUp ? scroll.percent : 0;

  const y1 = useTransformY(scroll.scrollY, distance * -7);
  const y2 = useTransformY(scroll.scrollY, distance * -6);
  const y3 = useTransformY(scroll.scrollY, distance * -5);
  const y4 = useTransformY(scroll.scrollY, distance * -4);
  const y5 = useTransformY(scroll.scrollY, distance * -3);

  const opacity = useTransform(
    scroll.scrollY,
    [0, 1],
    [1, mdUp ? Number((1 - scroll.percent / 100).toFixed(1)) : 1]
  );

  const renderHeading = (
    <MInview>
      <Box
        component="h1"
        display="flex"
        flexWrap="wrap"
        justifyContent="center"
        sx={{
          ...theme.typography.h2,
          my: 0,
          mx: 'auto',
          maxWidth: 680,
          fontFamily: theme.typography.fontSecondaryFamily,
          [theme.breakpoints.up(lgKey)]: { fontSize: 72, lineHeight: '90px' },
        }}
      >
        <Typography>
          <TypeAnimation
            sequence={[
                1000, // wait 1s before typing out "Welcome to SummEval."
              // Same substring at the start will only be typed out once, initially
              `Welcome to SummEval.`,
              3000, // wait 3s before replacing "Mice" with "Hamsters"
            ]}
            wrapper="span"
            speed={50}
            deletionSpeed={80}
            cursor={true}
            style={{
              fontSize: "2em",
              display: "block",
              whiteSpace: "pre-line",
            }}
            repeat={0}
          />
          </Typography>
      </Box>
    </MInview>
  );

  const renderText = (
    <MInview>
      <Typography
        variant="body2"
        sx={{
          mx: 'auto',
          [theme.breakpoints.up(smKey)]: { whiteSpace: 'pre' },
          [theme.breakpoints.up(lgKey)]: { fontSize: 20, lineHeight: '36px' },
        }}
      >
        {`SummEval aims to contribute to the advancement of LLM research \nand make the daily work of LLM experts more pleasant and insightful.`}
      </Typography>
    </MInview>
  );

  const renderButtons = (
    <Box display="flex" flexWrap="wrap" justifyContent="center" gap={{ xs: 1.5, sm: 2 }}>
      <MInview>
        <Button
          color="inherit"
          size="large"
          variant="contained"
          rel="noopener"
          href={paths.auth.jwt.register}
        >
          Register
        </Button>
      </MInview>

      <MInview>
        <Button
          color="inherit"
          size="large"
          variant="contained"
          rel="noopener"
          href={paths.auth.jwt.login}
        >
          Login
        </Button>
      </MInview>
    </Box>
  );

  return (
    <Stack
      ref={scroll.elementRef}
      component="section"
      sx={{
        overflow: 'hidden',
        position: 'relative',
        [theme.breakpoints.up(mdKey)]: {
          minHeight: 760,
          height: '100vh',
          maxHeight: 1440,
          display: 'block',
          willChange: 'opacity',
          mt: 'calc(var(--layout-header-desktop-height) * -1)',
        },
        ...sx,
      }}
      {...other}
    >
      <Box
        component={m.div}
        style={{ opacity }}
        sx={{
          width: 1,
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          transition: theme.transitions.create(['opacity']),
          [theme.breakpoints.up(mdKey)]: {
            height: 1,
            position: 'fixed',
            maxHeight: 'inherit',
          },
        }}
      >
        <Container
          component={MotionContainer}
          sx={{
            py: 3,
            gap: 5,
            zIndex: 9,
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            [theme.breakpoints.up(mdKey)]: {
              flex: '1 1 auto',
              justifyContent: 'center',
              py: 'var(--layout-header-desktop-height)',
            },
          }}
        >
          <Stack spacing={3} sx={{ textAlign: 'center' }}>
            <m.div style={{ y: y1 }}>{renderHeading}</m.div>
            <m.div style={{ y: y2 }}>{renderText}</m.div>
          </Stack>
          <m.div style={{ y: y3 }}>{renderButtons}</m.div>
        </Container>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function MInview({ children, component = m.div }) {
  return (
    <Box component={component} variants={varFade({ distance: 24 }).inUp}>
      {children}
    </Box>
  );
}

// ----------------------------------------------------------------------

function useTransformY(value, distance) {
  const physics = {
    mass: 0.1,
    damping: 20,
    stiffness: 300,
    restDelta: 0.001,
  };

  return useSpring(useTransform(value, [0, 1], [0, distance]), physics);
}

function useScrollPercent() {
  const elementRef = useRef(null);

  const { scrollY } = useScroll();

  const [percent, setPercent] = useState(0);

  useMotionValueEvent(scrollY, 'change', (scrollHeight) => {
    let heroHeight = 0;

    if (elementRef.current) {
      heroHeight = elementRef.current.offsetHeight;
    }

    const scrollPercent = Math.floor((scrollHeight / heroHeight) * 100);

    if (scrollPercent >= 100) {
      setPercent(100);
    } else {
      setPercent(Math.floor(scrollPercent));
    }
  });

  return { elementRef, percent, scrollY };
}
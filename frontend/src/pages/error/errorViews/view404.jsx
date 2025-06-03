import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { varBounce, MotionContainer } from '/src/components/Animate';


export function View404() {
  return (
      <Container component={MotionContainer}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            404 The page not found
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            Sorry, we couldn’t find the page you’re looking for.
          </Typography>
        </m.div>

        <Button href="/" size="large" variant="contained" sx={{m: 2}}>
          Go to home
        </Button>
      </Container>
  );
}
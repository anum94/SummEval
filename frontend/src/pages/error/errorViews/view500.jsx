import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { varBounce, MotionContainer } from '/src/components/Animate';

export function View500() {
  return (
      <Container component={MotionContainer}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            500 Internal server error
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            There was an error, please try again later.
          </Typography>
        </m.div>

        <Button component={RouterLink} href="/" size="large" variant="contained" sx={{m: 2}}>
          Go to home
        </Button>
      </Container>
  );
}
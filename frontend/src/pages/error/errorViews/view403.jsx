import { m } from 'framer-motion';

import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { varBounce, MotionContainer } from 'src/components/Animate';


export function View403() {
  return (
      <Container component={MotionContainer}>
        <m.div variants={varBounce().in}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            403 No permission
          </Typography>
        </m.div>

        <m.div variants={varBounce().in}>
          <Typography sx={{ color: 'text.secondary' }}>
            The page you’re trying to access has restricted access.
          </Typography>
        </m.div>

        <Button component={RouterLink} href="/" size="large" variant="contained" sx={{m: 2}}>
          Go to home
        </Button>
      </Container>
  );
}

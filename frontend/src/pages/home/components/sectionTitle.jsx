import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { varAlpha, textGradient } from '../../../theme/styles';

import { varFade } from '../../../components/Animate';

// Returns the title of the section
export function SectionTitle({ title, caption, slotProps, txtGradient, description, ...other }) {
  const theme = useTheme();

  return (
    <Stack spacing={3} {...other}>
      {caption && (
        <SectionCaption
          title={caption}
          variants={slotProps?.caption?.variants}
          sx={slotProps?.caption?.sx}
        />
      )}

      <Typography
        component={m.h2}
        variant="h2"
        variants={slotProps?.title?.variants ?? varFade({ distance: 24 }).inUp}
        sx={slotProps?.title?.sx}
      >
        {`${title} `}
        <Box
          component="span"
          sx={{
            opacity: 0.4,
            display: 'inline-block',
            ...textGradient(
              `to right, ${theme.vars.palette.text.primary}, ${varAlpha(theme.vars.palette.text.primaryChannel, 0.2)}`
            ),
          }}
        >
          {txtGradient}
        </Box>
      </Typography>

      {description && (
        <Typography
          component={m.p}
          variants={slotProps?.description?.variants ?? varFade({ distance: 24 }).inUp}
          sx={{ color: 'text.secondary', ...slotProps?.description?.sx }}
        >
          {description}
        </Typography>
      )}
    </Stack>
  );
}

// Returns the caption of the section
export function SectionCaption({ title, variants, sx }) {
  return (
    <Stack
      component={m.span}
      variants={variants ?? varFade({ distance: 24 }).inUp}
      sx={{ typography: 'overline', color: 'text.disabled', ...sx }}
    >
      {title}
    </Stack>
  );
}
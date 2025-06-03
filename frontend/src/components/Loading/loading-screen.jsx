import Box from '@mui/material/Box';
import Portal from '@mui/material/Portal';
import LinearProgress from '@mui/material/LinearProgress';


// Returns a loading screen with a linear progress bar.
export function LoadingScreen({ portal, sx, ...other }) {
  const content = (
    <Box
      sx={{
        px: 5,
        width: 1,
        flexGrow: 1,
        minHeight: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
      {...other}
    >
      <LinearProgress color="inherit" sx={{ width: 1, maxWidth: 360 }} />
    </Box>
  );

  // Portal is used to render the loading screen outside the DOM hierarchy of the parent component to avoid issues with z-index.
  if (portal) {
    return <Portal>{content}</Portal>;
  }

  return content;
}

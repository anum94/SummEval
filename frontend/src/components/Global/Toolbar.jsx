import * as React from "react";
import {
  Box,
  Toolbar as MuiToolbar,
  Typography,
  Divider,
  Grid,
  Stack,
  Chip
} from "@mui/material";

function Toolbar({ title, subtitles, button, tags }) {
  console.log('Tags: ', tags)
  return (
    <Box>
      <MuiToolbar>
        <Stack direction="row"spacing={1}>
          <Typography sx={{ flex: "1 1 100%", mr: 1 }} variant="h5" component="div">
            {title}
          </Typography>
       
          {tags  && tags.map((skill) => (
            <Chip key={skill} label={skill} variant="soft" />
          ))}
        </Stack>
        {button && <div style={{ marginLeft: "auto" }}>{button}</div>}
      </MuiToolbar>
      <MuiToolbar>
        <Box sx={{ flex: "1 1 100%" }}>
          <Grid container spacing={1}>
            {subtitles.map((subtitle) => (
              <>
                <Grid item xs={2}>
                  <Typography variant="body1">
                    {subtitle[0]}
                  </Typography>
                </Grid>
                <Grid item xs={10}>
                  <Typography variant="body1">
                    {subtitle[1]}
                  </Typography>
                </Grid>
              </>
            ))}
          </Grid>
        </Box>
      </MuiToolbar>
      <Divider sx={{ mb: 2, mt: 1 }} />
    </Box>
  );
};

export default Toolbar;
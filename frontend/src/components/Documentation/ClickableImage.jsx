import React, { useState } from "react";
import { Card, CardMedia, Dialog, DialogContent, IconButton, Box } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const ClickableImage = ({ imageSrc, altText }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card sx={{ maxWidth: 600, marginY: 2, cursor: "pointer" }} onClick={() => setOpen(true)}>
        <CardMedia
          component="img"
          sx={{
            maxWidth: "100%",
            maxHeight: "300px",
            objectFit: "contain",
            padding: "10px"
          }}
          image={imageSrc}
          alt={altText}
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg">
        <DialogContent>
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{
              position: "absolute",
              right: 10,
              top: 10,
              color: "white",
              background: "rgba(0,0,0,0.5)"
            }}
          >
            <CloseIcon />
          </IconButton>

          {/* Full-Size Image */}
          <Box
            component="img"
            sx={{
              width: "100%",
              height: "auto",
              maxWidth: "90vw",
              maxHeight: "90vh",
              objectFit: "contain"
            }}
            src={imageSrc}
            alt={altText}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClickableImage;

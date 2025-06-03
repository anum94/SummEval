import * as React from 'react';
import {
  Box,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Toolbar,
  List,
  ListItem,
  Typography,
  useTheme,
  Pagination,
  TextField,
  Button,
} from '@mui/material';

import AddFullTextDialog from './AddFullTextDialog';

function FullTextCard({ fullText, index }) {
  const [open, setOpen] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState(null);
  const theme = useTheme();

  const handleClose = () => {
    setMenuPosition(null);
  };

  return (
    <>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="lg">
        <DialogContent>
          <Grid container spacing={2} >
            <Grid item xs={12} md={6} sx={{padding: '3px'}}>
              <DialogTitle sx={{ textAlign: 'center' }}>Full Text</DialogTitle>
                <Box
                  sx={{
                    maxHeight: '500px',
                    overflow: 'auto',
                    padding: '8px',
                    borderTop: '1px solid #E0E0E0',
                    
                 
                  }}
                >
                  <Typography sx={{ textAlign: 'justify', padding: '3px'}}>
                    {fullText.fields.full_text}
                  </Typography>
                </Box>
             </Grid>
            {fullText.fields.reference_summary !== '' && (
              <Grid item xs={12} md={6} sx={{padding: '3px'}}>
                <DialogTitle sx={{ textAlign: 'center' }}>Reference Summary</DialogTitle>
                <Box
                  sx={{
                    maxHeight: '500px',
                    overflow: 'auto',
                    padding: '8px',
                    borderTop: '1px solid #E0E0E0',
                  }}
                >
                  <Typography sx={{ textAlign: 'justify' }}>
                    {fullText.fields.reference_summary}
              
                  </Typography>
                </Box>
              </Grid>
            )}

          </Grid>
        </DialogContent>
      </Dialog>
      <div onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        <Card
          variant="outlined"
          sx={{
            width: '100%',
            height: 100, // Fixed height for all cards
            border: 'none',
            //borderTop: '1px solid #E0E0E0',
            borderBottom: '1px solid #E0E0E0',
            boxShadow: 'none',
            borderRadius: 0,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'light' ? '#e0e0e0' : theme.palette.grey[700],
            },
          }}
        >
          <CardContent sx={{display: 'flex', flexWrap: 'nowrap',}}>
            <Typography variant="caption" color="textSecondary"   
            sx={{ 
              fontSize: '0.9rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginRight: '15px',
            }}>
              {index}.
            </Typography>
            <Typography
              sx={{
                display: '-webkit-box', // Enables flexbox for text layout
                WebkitBoxOrient: 'vertical', // Ensures vertical layout for the box
                overflow: 'hidden',    // Ensures content stays within the container
                WebkitLineClamp: 2,    // Limits the content to 2 lines
                textOverflow: 'ellipsis', // Adds "..." at the end of the second line if truncated
                flex: 1, // Ensures Typography takes up the remaining space
              }}
            >
              {fullText.fields.full_text}
            </Typography>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function FullTextsList({
  fullTexts,
  totalFullTexts,
  currentPage,
  setCurrentPage,
  fetchFullTexts,
}) {
  const [openAddFullTextDialog, setOpenAddFullTextDialog] = React.useState(false);
  const [jumpPage, setJumpPage] = React.useState('');

  const pageSize = 10;
  const totalPages = Math.ceil(totalFullTexts / pageSize);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    fetchFullTexts(page);
  };

  const handleJumpPage = () => {
    const pageNumber = parseInt(jumpPage, 10);

    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      fetchFullTexts(pageNumber);
      setJumpPage('');
    } else {
      alert(`Invalid page number. Please enter a value between 1 and ${totalPages}.`);
    }
  };

  return (
    <>
      {openAddFullTextDialog && project && (
        <AddFullTextDialog
          projectId={project.pk}
          handleClose={() => setOpenAddFullTextDialog(false)}
        />
      )}
      <Card variant="outlined" sx={{ borderRadius: '10px', flex: 1 }}>
  
        {!fullTexts || fullTexts.length === 0 ? (
          <Typography align="center" m={10}>
            No full texts added yet.
          </Typography>
        ) : (
          <Box sx={{ overflowY: 'scroll', padding: 1 }}>
            <Typography align="center" sx={{ flex: '1 1 100%', padding:'15px' }} variant="h6" id="tableTitle" component="div">
            Full Texts
            <List
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
              }}
            >
              {fullTexts.map((fullText, index) => (
                <ListItem
                key={index}
                sx={{
                  width: '100%', // Ensures each ListItem takes full width
                  display: 'block', // Ensures items stack properly one below the other

                }}
                >
                  <FullTextCard
                    fullText={fullText}
                    index={(currentPage - 1) * pageSize + index + 1}
                  />
                </ListItem>
              ))}
            </List>
            </Typography>
          </Box>
        
        )}
       
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            mt: 2,
            mb: 3,
            position: 'relative',
          }}
        >
          <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} />
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 1, 
              padding: 2,
            }}
          >
            <TextField
              size="small"
              variant="outlined"
              placeholder="Go to page"
              value={jumpPage}
              onChange={(e) => setJumpPage(e.target.value)}
              sx={{ width: 105 }}

            />
            <Button variant="contained" color="primary" onClick={handleJumpPage}>
              Go
            </Button>
          </Box>
        </Box>
      </Card>
    </>
  );
}

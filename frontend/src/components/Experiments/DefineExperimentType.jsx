import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, Tooltip, IconButton } from '@mui/material';
import { HelpOutline} from '@mui/icons-material';
import CreateExperimentDialog from './CreateExperimentDialog'; 
import StartExperimentDialog from './StartExperimentDialog';

export default function DefineExperimentType({ project, experiments, addExperiment, fullTexts, handleClose, totalFullTexts }) {
  //const [openCreateDialog, setOpenCreateDialog] = useState(false);
  //const [openStartDialog, setOpenStartDialog] = useState(false);

  const [dialogType, setDialogType] = useState(null); // Tracks which dialog is open: 'create' or 'start'
  const [modelCheck, setModelCheck] = useState(null);

  // Handle the opening of CreateExperimentDialog for any action
  const handleOpenDialog = (type) => {
    setDialogType(type);
    console.log(`${type} Experiment dialog opened`); // Debugging: Log which dialog is triggered
  };

  const handleCloseDialog = () => {
    console.log('Dialog closed'); // Debugging: Log closing of dialog
    setDialogType(null);
    handleClose();
  };

  //use "modelCheck" for backend to distinsguish different cases
  const handleModelCheck = (response) => {
    setModelCheck(response);
    if (response === 'yes') {
    setDialogType('start'); 
    } else {
     setDialogType('start');
    }
  };

  return (
    <>
      {/* DefineExperimentType dialog */}
    {dialogType !== 'modelCheck' && (   
      <Dialog open={true} onClose={handleClose}>
        <DialogTitle>Do you have previously generated LLM summaries for your full texts?</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Button for Upload Experiment */}
            <Button
    
              onClick={() => handleOpenDialog('create')}
              sx={{
                width: '100%',
                variant: 'soft',
                border: '1px solid #E0E0E0',

              }}
            >
              Yes
            </Button>

            {/* Button for Start Experiment */}
            <Button
              //onClick={() => handleOpenDialog('start')}
              onClick={() => handleOpenDialog('modelCheck')}
              sx={{
                width: '100%',
                variant: 'soft',
                border: '1px solid #E0E0E0',
              }}
            >
              No
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => {
              console.log('Cancel button clicked'); // Debugging: Track cancel action
              handleClose();
            }}
            
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
      )}
      {/* Model Check Dialog */}
    {dialogType === 'modelCheck' && (
            <Dialog open={true} onClose={handleCloseDialog} maxWidth="sm" fullWidth={true}>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Do you have your own models deployed?
                <Tooltip
                  title="For YES: You need to provide an API endpoint where your model is deployed to generate the summaries. For No: You will use the LLM models we provided like GPT or TogetherAI."
                >
                  <IconButton>
                    <HelpOutline />
                  </IconButton>
                </Tooltip>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      onClick={() => handleModelCheck('yes')}
                      sx={{ flex: 1, variant: 'soft',    
                        border: '1px solid #E0E0E0', }}
                    >
                      Yes
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button
                      onClick={() => handleModelCheck('no')}
                      sx={{ flex: 1, variant: 'soft',      
                        border: '1px solid #E0E0E0', }}
                    >
                      No
                    </Button>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => {
                    handleClose();
                  }}
                  color="primary"
                >
                  Cancel
                </Button>
              </DialogActions>
            </Dialog>
          )}


      {/* CreateExperimentDialog */}
      {dialogType === 'create' ? (
        <>
          {console.log('dialogType is "create", rendering CreateExperimentDialog')} {/* Debugging: Check if state is 'create' */}
          <CreateExperimentDialog
            handleClose={() => {
              console.log('CreateExperimentDialog closed'); // Debugging: Track closing of CreateExperimentDialog
              handleCloseDialog();
              console.log('dialogType set to null after CreateExperimentDialog close'); // Confirm reset
            }}
            project={project}
            fullTexts={fullTexts}
            addExperiment={addExperiment}
            totalFullTexts={totalFullTexts}
          />
        </>
      ) : (
        console.log('dialogType is not "create", not rendering CreateExperimentDialog') // Debugging: If dialogType is not 'create'
      )}

      {/* StartExperimentDialog */}
      {dialogType === 'start' ? (
        <>
          {console.log('dialogType is "start", rendering StartExperimentDialog')} {/* Debugging: Check if state is 'start' */}
          <StartExperimentDialog
            handleClose={() => {
              console.log('StartExperimentDialog closed'); // Debugging: Track closing of StartExperimentDialog
              handleCloseDialog();
              console.log('dialogType set to null after StartExperimentDialog close'); // Confirm reset
            }}
            project={project}
            fullTexts={fullTexts}
            addExperiment={addExperiment}
            totalFullTexts={totalFullTexts}
            apiLinkRequired={modelCheck === 'yes'}
          />
        </>
      ) : (
        console.log('dialogType is not "start", not rendering StartExperimentDialog') // Debugging: If dialogType is not 'start'
      )}
    </>
  );
}
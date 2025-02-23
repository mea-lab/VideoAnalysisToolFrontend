// src/pages/TaskDetails/JSONUploadDialog.jsx
import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { CircularProgress, Input, Typography } from '@mui/material';
import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function JSONUploadDialog({
  dialogOpen,
  setDialogOpen,
  handleJSONUpload,
  boundingBoxes,
  videoRef,
  fps,
  tasks,
  taskBoxes,
  selectedTask,
}) {
  // console.log("Tasks",tasks)
  // console.log("Selected Task",selectedTask)
  const [fileError, setFileError] = useState('');
  const [jsonContent, setJSONContent] = useState(null);
  const [serverProcessing, setServerProcessing] = useState(false);

  const handleClose = () => {
    setDialogOpen(false);
    setFileError('');
  };

  const handleJSONProcess = () => {
    setFileError('');
    handleJSONUpload(true, jsonContent);
    setDialogOpen(false);
  };

  const handleAutoProcess = async () => {
    await getAnalysis();
  };

  const validateJson = data => {
    return true;
  };

  const handleFileChange = async event => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.json') || file.name.endsWith('.parse')) {
        try {
          const content = await file.text();
          const jsonContent = JSON.parse(content);
          if (validateJson(jsonContent)) {
            setJSONContent(JSON.parse(content));
            setFileError('');
          }
        } catch (error) {
          setFileError('Error reading the file.');
        }
      } else {
        setFileError('Please select a valid JSON file.');
      }
    }
  };

  const getAnalysis = async () => {
    setServerProcessing(true);
    const videoURL = videoRef.current.src;
    let blob = await fetch(videoURL).then(r => r.blob());

    fetchAnalysisDetails(blob);
  };

  const fetchAnalysisDetails = async content => {
    try {
      let uploadData = new FormData();
      uploadData.append('video', content);
      let taskData = tasks[selectedTask];

      const chosenTaskBox = taskBoxes.find(box => box.id === taskData.id);
      const taskBoxCords = {
        x: chosenTaskBox.x,
        y: chosenTaskBox.y,
        width: chosenTaskBox.width,
        height: chosenTaskBox.height,
      };

      let jsonData = {
        boundingBox: taskBoxCords,
        task_name: taskData.name,
        start_time: taskData.start,
        end_time: taskData.end,
        fps: fps,
      };
      
      // console.log("Uploaded Data Content:", jsonData)
      jsonData = JSON.stringify(jsonData);
      uploadData.append('json_data', jsonData);

      let apiURL = 'http://localhost:8000/api/leg_raise/';
      if (taskData.name.includes('Leg agility'))
        apiURL = 'http://localhost:8000/api/leg_raise/';
      else if (taskData.name.includes('Toe tapping'))
        apiURL = 'http://localhost:8000/api/toe_tap/';

      const response = await fetch(apiURL, {
        method: 'POST',
        body: uploadData,
      });
      if (response.ok) {
        const data = await response.json();
        // console.log("Returned Data Content:", data)
        if (validateJson(data)) {
          handleJSONUpload(true, data);
          setDialogOpen(false);
        } else {
          throw new Error('Invalid input received from server');
        }
        setServerProcessing(false);
      } else {
        throw new Error('Server responded with an error!');
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setFileError(error);
    }
  };

  return (
    <React.Fragment>
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>Task Setup</DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent>
          <DialogContentText>
            {!serverProcessing && (
              <>
                Upload JSON containing the task analysis data or click on
                analyze to analyze the task automatically.
              </>
            )}
            {serverProcessing && (
              <div
                className={
                  'flex flex-col w-full h-full justify-center items-center gap-10'
                }
              >
                <div>Server processing the request</div>
                <CircularProgress size={80} />
              </div>
            )}
          </DialogContentText>
          {!serverProcessing && (
            <div>
              <Input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ margin: '10px 0' }}
                label="Upload JSON file"
              />
              {fileError && <Typography color="error">{fileError}</Typography>}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {!serverProcessing && (
            <>
              <Button
                onClick={handleJSONProcess}
                disabled={jsonContent === null}
              >
                Analyse from JSON
              </Button>
              <Button onClick={handleAutoProcess}>Auto Analyze</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

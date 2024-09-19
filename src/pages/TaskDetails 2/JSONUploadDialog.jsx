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
  videoRef,
  fps,
  tasks,
  selectedTask,
}) {
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

  const validateOldJson = json => {
    if (!Array.isArray(json)) {
      return false;
    }

    for (let item of json) {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('id' in item) ||
        !('start' in item) ||
        !('end' in item) ||
        !('attributes' in item)
      ) {
        return false;
      }

      if (
        typeof item.id !== 'string' ||
        typeof item.start !== 'number' ||
        typeof item.end !== 'number' ||
        typeof item.attributes !== 'object' ||
        item.attributes === null ||
        !('label' in item.attributes) ||
        typeof item.attributes.label !== 'string'
      ) {
        return false;
      }

      if (item.start >= item.end) {
        return false;
      }
    }

    return true;
  };

  const validateNewJson = data => {
    if (!('fps' in data)) {
      throw new Error('fps field is missing.');
    } else if (typeof data.fps !== 'number') {
      throw new Error('fps should be a number.');
    }

    if (!('boundingBoxes' in data)) {
      throw new Error('boundingBoxes field is missing.');
    } else if (!Array.isArray(data.boundingBoxes)) {
      throw new Error('boundingBoxes should be an array.');
    }

    data.boundingBoxes.forEach(box => {
      if (!('frameNumber' in box)) {
        throw new Error('frameNumber field in boundingBoxes is missing.');
      } else if (typeof box.frameNumber !== 'number') {
        throw new Error('frameNumber in boundingBoxes should be a number.');
      }

      if (!('data' in box)) {
        throw new Error('data field in boundingBoxes is missing.');
      } else if (!Array.isArray(box.data)) {
        throw new Error('data in boundingBoxes should be an array.');
      }

      box.data.forEach(item => {
        if (!('id' in item)) {
          throw new Error('id field in boundingBoxes data is missing.');
        }

        ['x', 'y', 'width', 'height'].forEach(prop => {
          if (!(prop in item)) {
            throw new Error(`${prop} field in boundingBoxes data is missing.`);
          } else if (typeof item[prop] !== 'number') {
            throw new Error(
              `${prop} in boundingBoxes data should be a number.`,
            );
          }
        });
      });
    });

    return true;
  };

  const validateJson = data => {
    let validNewJson = false;
    let validOldJson = false;
    let errorMessage = '';
    try {
      validNewJson = validateNewJson(data);
    } catch (error) {
      errorMessage = error.message;
      // setFileError(error.message);
      validNewJson = false;
    }

    try {
      validOldJson = validateOldJson(data);
    } catch (error) {
      errorMessage = error.message;
      // setFileError(error.message);
      validOldJson = false;
    }

    if (validNewJson || validOldJson) {
      setFileError(errorMessage);
      return true;
    }

    return false;
  };

  const fetchAnalysisDetails = async content => {
    try {
      let uploadData = new FormData();
      uploadData.append('video', content);
      let taskData = tasks[selectedTask];

      let boundingBox = {
        x: taskData.x,
        y: taskData.y,
        width: taskData.width,
        height: taskData.height,
      };

      let jsonData = {
        boundingBox: boundingBox,
        task_name: taskData.name,
        start_time: taskData.start,
        end_time: taskData.end,
        fps: fps,
      };

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

  const getAnalysis = async () => {
    setServerProcessing(true);
    const videoURL = videoRef.current.src;

    let blob = await fetch(videoURL).then(r => r.blob());

    fetchAnalysisDetails(blob);
  };

  const handleAutoProcess = async () => {
    await getAnalysis();
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
            // setFileName(file.name);
            setFileError('');
          }
        } catch {
          setFileError('Error reading the file.');
        }
      } else {
        setFileError('Please select a valid JSON file.');
      }
    }
  };

  return (
    <>
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
                analyse to analyse the task automatically.
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
              <Button onClick={handleAutoProcess}>Auto Analyse</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

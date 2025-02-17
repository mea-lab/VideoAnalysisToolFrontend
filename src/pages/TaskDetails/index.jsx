import VideoPlayer from '../../components/commons/VideoPlayer/VideoPlayer';
import { useContext } from 'react';
import { VideoContext } from '../../contexts/VideoContext';
import React, { useEffect, useRef, useState } from 'react';
import HeaderSection from './HeaderSection';
import Button from '@mui/material/Button';
import JSONUploadDialog from './JSONUploadDialog';
import PlotWidget from './PlotWidget';
import { RestartAlt, CloudDownload, TouchApp } from '@mui/icons-material';

function useDebounce(callback, delay) {
  const argsRef = useRef();
  const timeout = useRef();

  function debouncedFunction(...args) {
    argsRef.current = args;
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      if (argsRef.current) {
        callback(...argsRef.current);
      }
    }, delay);
  }

  return debouncedFunction;
}

const TaskDetails = () => {
  const {
    videoReady,
    setVideoReady,
    videoData,
    setVideoData,
    videoURL,
    setVideoURL,
    videoRef,
    fileName,
    setFileName,
    boundingBoxes,
    setBoundingBoxes,
    fps,
    setFPS,
    taskBoxes,
    setTaskBoxes,
    tasks,
    setTasks,
    tasksReady,
    setTasksReady,
    persons,
    setPersons,
    boxesReady,
    setBoxesReady,
  } = useContext(VideoContext);

  const [dataReady, setDataReady] = useState(false);
  const [openJsonUpload, setOpenJsonUpload] = useState(false);
  const [selectedTask, setSelectedTask] = useState(0);
  const [selectedTaskName, setSelectedTaskName] = useState();
  const [taskRecord, setTaskRecord] = useState({});
  const [taskToPlotMap, setTaskToPlotMap] = useState({});
  const [landMarks, setLandMarks] = useState([]);
  const [allLandMarks, setAllLandMarks] = useState([]);
  const [normalizationLandMarks, setNormalizationLandMarks] = useState([]);
  const [normalizationFactor, setNormalizationFactor] = useState();
  const [frameOffset, setFrameOffset] = useState(0);

  useEffect(() => {
    if(!videoReady) {
      return;
    }

    console.log("Tasks:", tasks);
    const taskData = tasks[selectedTask];
    const startTime = taskData.start;

    console.log("Setting task name to...", tasks[selectedTask].name);
    setSelectedTaskName(tasks[selectedTask].name);

    videoRef.current.currentTime = startTime;

    videoRef.current.ontimeupdate = event => {
      const currentTime = event.target.currentTime;
      if (currentTime >= taskData.end) {
        videoRef.current.currentTime = startTime;
      }
    };
  }, [selectedTask,videoReady]);

  const onFPSCalculation = fps => {
    setVideoReady(true);
  };

  const handleProcessing = (jsonFileUploaded, jsonContent) => {
    if (jsonFileUploaded && jsonContent !== null) {
      if (jsonContent.hasOwnProperty('linePlot')) {
        let updatedRecord = taskToPlotMap[selectedTaskName] || {};

        if (jsonContent.hasOwnProperty('linePlot')) {
          updatedRecord = {
            ...updatedRecord,
            linePlot: jsonContent.linePlot,
            velocityPlot: jsonContent.velocityPlot,
            rawData: jsonContent.rawData,
            peaks: jsonContent.peaks,
            valleys_start: jsonContent.valleys_start,
            valleys_end: jsonContent.valleys_end,
            valleys: jsonContent.valleys,
          };
        }

        if (jsonContent.hasOwnProperty('radar')) {
          updatedRecord = {
            ...updatedRecord,
            radar: jsonContent.radar,
          };
        }

        if (jsonContent.hasOwnProperty('radarTable')) {
          updatedRecord = {
            ...updatedRecord,
            radarTable: {
              ...updatedRecord.radarTable, // Merge existing radarTable
              ...jsonContent.radarTable, // Add or override with new values
            },
          };
        }

        if (jsonContent.hasOwnProperty('landMarks')) {
          updatedRecord = {
            ...updatedRecord,
            landMarks: jsonContent.landMarks,
          };
          setLandMarks(jsonContent.landMarks);
        }
        if (jsonContent.hasOwnProperty('allLandMarks')) {
          updatedRecord = {
            ...updatedRecord,
            allLandMarks: jsonContent.allLandMarks,
          };
          setAllLandMarks(jsonContent.allLandMarks);
        }
        if (jsonContent.hasOwnProperty('normalization_landmarks')) {
          updatedRecord = {
            ...updatedRecord,
            normalizationLandMarks: jsonContent.normalization_landmarks,
          };
          setNormalizationLandMarks(jsonContent.normalization_landmarks);
        }

        if (jsonContent.hasOwnProperty('normalization_factor')) {
          updatedRecord = {
            ...updatedRecord,
            normalization_factor: jsonContent.normalization_factor,
          };
          setNormalizationFactor(jsonContent.normalization_factor);
        }

        updatedRecord = {
          ...updatedRecord,
          fileName: fileName.replace(/\.[^/.]+$/, ''),
        };

        let taskToPlotMap_New = { ...taskToPlotMap };
        taskToPlotMap_New[selectedTaskName] = updatedRecord;

        setTaskToPlotMap(taskToPlotMap_New);
      } else {
        console.log('Error while reading the json content of graph');
      }
      setDataReady(true);
    }
  };

  const resetTask = () => {
    let newTaskToPlotMap = { ...taskToPlotMap };
    if (newTaskToPlotMap.hasOwnProperty(selectedTaskName)) {
      newTaskToPlotMap[selectedTaskName] = null;
      setTaskToPlotMap(newTaskToPlotMap);
    }
  };

  const DownloadCurrentTask = () => {
    console.log("Downloading task name", selectedTaskName);
    const fileData = taskToPlotMap[selectedTaskName];

    const downloadContent = {
      linePlot: fileData.linePlot,
      velocityPlot: fileData.velocityPlot,
      rawData: fileData.rawData,
      peaks: fileData.peaks,
      valleys: fileData.valleys,
      valleys_start: fileData.valleys_start,
      valleys_end: fileData.valleys_end,
      radar: {
        ...fileData.radar,
      },
      radarTable: fileData.radarTable,
      landMarks: fileData.landMarks,
      allLandMarks: fileData.allLandMarks,
      normalization_landmarks: fileData.normalizationLandMarks,
      normalization_factor: fileData.normalizationFactor,
    };

    const json = JSON.stringify(downloadContent);
    const blob = new Blob([json], { type: 'application/json' });
    const href = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = href;
    link.download =
      fileName.replace(/\.[^/.]+$/, '') + '_' + selectedTaskName + '.json';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  // Debounced function for updating landmarks to backend
  const debouncedUpdateLandmarks = useDebounce(async newLandMarks => {
    try {
      const taskData = tasks[selectedTask];
      let uploadData = new FormData();

      let jsonData = {
        task_name: selectedTaskName,
        start_time: taskData.start,
        end_time: taskData.end,
        fps: fps,
        landmarks: taskToPlotMap[selectedTaskName].landMarks,
        normalization_factor:
          taskToPlotMap[selectedTaskName].normalization_factor,
      };

      jsonData = JSON.stringify(jsonData);

      uploadData.append('json_data', jsonData);
      const response = await fetch(
        'http://localhost:8000/api/update_landmarks/',
        {
          method: 'POST',
          body: uploadData,
        },
      );
      if (response.ok) {
        const data = await response.json();
        if (true) {
          handleProcessing(true, data);
        } else {
          throw new Error('Invalid input received from server');
        }
      } else {
        throw new Error('Server responded with an error!');
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, 1000);

  const updateNewLandMarks = newLandMarks => {
    let newTaskToPlotMap = { ...taskToPlotMap };
    if (newTaskToPlotMap.hasOwnProperty(selectedTaskName)) {
      newTaskToPlotMap[selectedTaskName].landMarks = newLandMarks;
      setTaskToPlotMap(newTaskToPlotMap);
    }
  };

  const handleLandMarksChange = newLandMarks => {
    setLandMarks(newLandMarks);
    updateNewLandMarks(newLandMarks);
    debouncedUpdateLandmarks(newLandMarks);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        {/* Video Section */}
        <div className="flex-1 min-w-[50%] bg-slate-900">
          <VideoPlayer
            videoData={videoData}
            screen={'taskDetails'}
            taskBoxes={taskBoxes}
            videoRef={videoRef}
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            fps={fps}
            persons={persons}
            fpsCallback={onFPSCalculation}
            setVideoReady={setVideoReady}
            videoURL={videoURL}
            setVideoData={setVideoData}
            fileName={fileName}
            setFileName={setFileName}
            setVideoURL={setVideoURL}
            landMarks={taskToPlotMap[selectedTaskName]?.landMarks}
            setLandMarks={handleLandMarksChange}
            setTaskBoxes={setTaskBoxes}
            selectedTask={selectedTask}
            frameOffset={frameOffset}
          />
        </div>

        {/* Right panel with details & graph */}
        <div className="flex-1 flex flex-col min-w-[50%] bg-slate-50 overflow-y-auto">
          <HeaderSection
            title={'Task Details'}
            isVideoReady={videoReady}
            fileName={fileName}
            fps={fps}
            boundingBoxes={boundingBoxes}
            taskBoxes={taskBoxes}
          />

          {/* Task selector and reset/download controls */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            <div className="text-lg font-bold">Current task -</div>
            <select
              className="text-lg border border-gray-300 rounded-md px-2 py-1"
              name="Tasks"
              id="tasks"
              value={selectedTask}
              onChange={e => {
                setSelectedTask(e.target.value);
              }}
            >
              {tasks.map((task, index) => (
                <option key={index} value={index}>
                  {task.name}
                </option>
              ))}
            </select>
            
            <Button
              variant="contained"
              onClick={resetTask}
              startIcon={<RestartAlt />}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                textTransform: 'none',
                fontWeight: 'bold',
                px: 3,
                py: 1,
              }}
            >
              Reset
            </Button>

            {taskToPlotMap[selectedTaskName] != null && (
              <Button
                variant="contained"
                onClick={DownloadCurrentTask}
                startIcon={<CloudDownload />}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1,
                }}
              >
                Download
              </Button>
            )}
          </div>

          {/* Frame offset controls */}
          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            <div className="font-bold">Adjust frame offset</div>
            <Button
              variant="contained"
              onClick={() => setFrameOffset(prevVal => prevVal - 1)}
              sx={{
                minWidth: '40px',
                fontWeight: 'bold',
                px: 2,
                py: 1,
              }}
            >
              -
            </Button>

            <div>{frameOffset}</div>

            <Button
              variant="contained"
              onClick={() => setFrameOffset(prevVal => prevVal + 1)}
              sx={{
                minWidth: '40px',
                fontWeight: 'bold',
                px: 2,
                py: 1,
              }}
            >
              +
            </Button>
          </div>

          {/* Conditional rendering of plot or "Analyze" */}
          {taskToPlotMap[selectedTaskName] == null && (
            <div
              className={
                'flex justify-center items-center h-full flex-col gap-4 w-full px-10 flex-1 py-4 overflow-y-scroll'
              }
            >
              <div>Analyze the task</div>
              <Button
                variant="contained"
                onClick={() => setOpenJsonUpload(true)}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 3,
                  py: 1,
                  fontSize: '1rem',
                }}
              >
                Analyze
              </Button>
              <JSONUploadDialog
                dialogOpen={openJsonUpload}
                fps={fps}
                setDialogOpen={setOpenJsonUpload}
                handleJSONUpload={handleProcessing}
                boundingBoxes={boundingBoxes}
                videoRef={videoRef}
                tasks={tasks}
                taskBoxes={taskBoxes}
                selectedTask={selectedTask}
              />
            </div>
          )}

          {taskToPlotMap[selectedTaskName] != null && (
            <PlotWidget
              key={selectedTask}
              taskName={selectedTaskName}
              taskRecord={taskToPlotMap[selectedTaskName]}
              videoRef={videoRef}
              startTime={taskBoxes[selectedTask].start}
              endTime={taskBoxes[selectedTask].end}
              handleJSONUpload={handleProcessing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;

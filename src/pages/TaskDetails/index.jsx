import React, { useContext, useEffect, useRef, useState } from 'react';
import VideoPlayer from '../../components/commons/VideoPlayer/VideoPlayer';
import { VideoContext } from '../../contexts/VideoContext';
import HeaderSection from './HeaderSection';
import Button from '@mui/material/Button';
import JSONUploadDialog from './JSONUploadDialog';
import PlotWidget from './PlotWidget';
import { RestartAlt, CloudDownload, TouchApp } from '@mui/icons-material';

function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  return (...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  };
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
  const [taskToPlotMap, setTaskToPlotMap] = useState({});
  const [landMarks, setLandMarks] = useState([]);
  const [normalizationLandMarks, setNormalizationLandMarks] = useState([]);
  const [normalizationFactor, setNormalizationFactor] = useState();
  const [frameOffset, setFrameOffset] = useState(0);

  useEffect(() => {
    if (!videoReady) return;
    const task = tasks[selectedTask];
    if (!task) return;
    setSelectedTaskName(task.name);
    videoRef.current.currentTime = task.start;
    videoRef.current.ontimeupdate = event => {
      if (event.target.currentTime >= task.end) {
        videoRef.current.currentTime = task.start;
      }
    };
  }, [selectedTask, videoReady, tasks, videoRef]);

  const onFPSCalculation = (fps) => {
    setVideoReady(true);
  };

  const handleProcessing = (jsonFileUploaded, jsonContent) => {
    console.log("Returned json content", jsonContent);
    if (jsonFileUploaded && jsonContent) {
      if (jsonContent.linePlot) {
        let updatedRecord = taskToPlotMap[selectedTaskName] || {};
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
        if (jsonContent.radar) updatedRecord.radar = jsonContent.radar;
        if (jsonContent.radarTable)
          updatedRecord.radarTable = { ...updatedRecord.radarTable, ...jsonContent.radarTable };
        if (jsonContent.landMarks) {
          updatedRecord.landMarks = jsonContent.landMarks;
          setLandMarks(jsonContent.landMarks);
        }
        if (jsonContent.normalization_landmarks) {
          updatedRecord.normalizationLandMarks = jsonContent.normalization_landmarks;
          setNormalizationLandMarks(jsonContent.normalization_landmarks);
        }
        if (jsonContent.normalization_factor) {
          updatedRecord.normalization_factor = jsonContent.normalization_factor;
          setNormalizationFactor(jsonContent.normalization_factor);
        }
        updatedRecord.fileName = fileName.replace(/\.[^/.]+$/, '');
        setTaskToPlotMap({
          ...taskToPlotMap,
          [selectedTaskName]: updatedRecord,
        });
      } else {
        console.log('Error while reading the json content of graph');
      }
      setDataReady(true);
    }
  };

  const resetTask = () => {
    if (taskToPlotMap[selectedTaskName]) {
      setTaskToPlotMap({ ...taskToPlotMap, [selectedTaskName]: null });
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
      radar: { ...fileData.radar },
      radarTable: fileData.radarTable,
      landMarks: fileData.landMarks,
      allLandMarks: fileData.allLandMarks,
      normalization_landmarks: fileData.normalizationLandMarks,
      normalization_factor: fileData.normalizationFactor,
    };
    const jsonStr = JSON.stringify(downloadContent);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_${selectedTaskName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const debouncedUpdateLandmarks = useDebounce(async newLandMarks => {
    try {
      const { start, end } = tasks[selectedTask];
      const jsonData = JSON.stringify({
        task_name: selectedTaskName,
        start_time: start,
        end_time: end,
        fps,
        landmarks: taskToPlotMap[selectedTaskName].landMarks,
        normalization_factor: taskToPlotMap[selectedTaskName].normalization_factor,
      });
      const uploadData = new FormData();
      uploadData.append('json_data', jsonData);
      const response = await fetch('http://localhost:8000/api/update_landmarks/', {
        method: 'POST',
        body: uploadData,
      });
      if (response.ok) {
        const data = await response.json();
        handleProcessing(true, data);
      } else {
        throw new Error('Server responded with an error!');
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, 1000);

  const updateNewLandMarks = newLandMarks => {
    if (taskToPlotMap[selectedTaskName]) {
      setTaskToPlotMap({
        ...taskToPlotMap,
        [selectedTaskName]: { ...taskToPlotMap[selectedTaskName], landMarks: newLandMarks },
      });
    }
  };

  const handleLandMarksChange = newLandMarks => {
    setLandMarks(newLandMarks);
    updateNewLandMarks(newLandMarks);
    debouncedUpdateLandmarks(newLandMarks);
  };

  const commonButtonStyle = {
    bgcolor: 'primary.main',
    '&:hover': { bgcolor: 'primary.dark' },
    textTransform: 'none',
    fontWeight: 'bold',
    px: 3,
    py: 1,
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 min-w-[50%] bg-slate-900">
          <VideoPlayer
            videoData={videoData}
            screen="taskDetails"
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
        <div className="flex-1 flex flex-col min-w-[50%] bg-slate-50 overflow-y-auto">
          <HeaderSection
            title="Task Details"
            isVideoReady={videoReady}
            fileName={fileName}
            fps={fps}
            boundingBoxes={boundingBoxes}
            taskBoxes={taskBoxes}
          />
          <div className="flex items-center justify-center gap-2 mt-2 mb-4">
            <div className="text-lg font-bold">Current task -</div>
            <select
              className="text-lg border border-gray-300 rounded-md px-2 py-1"
              value={selectedTask}
              onChange={e => setSelectedTask(Number(e.target.value))}
            >
              {tasks.map((task, index) => (
                <option key={index} value={index}>
                  {task.name}
                </option>
              ))}
            </select>
            <Button variant="contained" onClick={resetTask} startIcon={<RestartAlt />} sx={commonButtonStyle}>
              Reset
            </Button>
            {taskToPlotMap[selectedTaskName] && (
              <Button
                variant="contained"
                onClick={DownloadCurrentTask}
                startIcon={<CloudDownload />}
                sx={commonButtonStyle}
              >
                Download
              </Button>
            )}
          </div>
          {!taskToPlotMap[selectedTaskName] && (
            <div className="flex justify-center items-center h-full flex-col gap-4 w-full px-10 flex-1 py-4 overflow-y-scroll">
              <div>Analyze the task</div>
              <Button
                variant="contained"
                onClick={() => setOpenJsonUpload(true)}
                sx={{ ...commonButtonStyle, fontSize: '1rem' }}
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
          {taskToPlotMap[selectedTaskName] && (
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

import React, { useContext, useEffect, useRef, useState } from 'react';
import VideoPlayer from '../../components/commons/VideoPlayer/VideoPlayer';
import { VideoContext } from '../../contexts/VideoContext';
import HeaderSection from './HeaderSection';
import Button from '@mui/material/Button';
import JSONUploadDialog from './JSONUploadDialog';
import PlotWidget from './PlotWidget';
import { RestartAlt, CloudDownload } from '@mui/icons-material';

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
    boundingBoxes,
    setBoundingBoxes,
    fps,
    taskBoxes,
    setTaskBoxes,
    tasks,
    setTasks,
    persons,
  } = useContext(VideoContext);

  const [openJsonUpload, setOpenJsonUpload] = useState(false);
  const [selectedTask, setSelectedTask] = useState(0);

  useEffect(() => {
    if (!videoReady) return;
    const task = tasks[selectedTask];
    if (!task) return;
    videoRef.current.currentTime = task.start;
    videoRef.current.ontimeupdate = event => {
      if (event.target.currentTime >= task.end) {
        videoRef.current.currentTime = task.start;
      }
    };
  }, [selectedTask, videoReady, tasks, videoRef]);

  const handleProcessing = (jsonFileUploaded, jsonContent) => {
    if (jsonFileUploaded && jsonContent) {
      const safeFileName = fileName.replace(/\.[^/.]+$/, '');
      setTasks(prev => {
        const newTasks = [...prev];
        newTasks[selectedTask] = { ...newTasks[selectedTask], data: { ...jsonContent, fileName: safeFileName } };
        return newTasks;
      });
    }
  };

  const resetTask = () => {
    setTasks(prev => {
      const newTasks = [...prev];
      newTasks[selectedTask] = { ...newTasks[selectedTask], data: null };
      return newTasks;
    });
  };

  const DownloadCurrentTask = () => {
    const currentTask = tasks[selectedTask];
    const fileData = currentTask.data;
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
    link.download = `${fileName.replace(/\.[^/.]+$/, '')}_${currentTask.name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const debouncedUpdateLandmarks = useDebounce(async newLandMarks => {
    try {
      const { start, end, data } = tasks[selectedTask];
      const currentTaskName = tasks[selectedTask].name;
      const jsonData = JSON.stringify({
        task_name: currentTaskName,
        start_time: start,
        end_time: end,
        fps,
        landmarks: data.landMarks,
        normalization_factor: data.normalizationFactor,
      });
      const uploadData = new FormData();
      uploadData.append('json_data', jsonData);
      const response = await fetch('http://localhost:8000/api/update_landmarks/', {
        method: 'POST',
        body: uploadData,
      });
      if (response.ok) {
        const updatedData = await response.json();
        handleProcessing(true, updatedData);
      } else {
        throw new Error('Server responded with an error!');
      }
    } catch (error) {
      console.error('Failed to update landmarks:', error);
    }
  }, 1000);

  const updateNewLandMarks = newLandMarks => {
    setTasks(prev => {
      const newTasks = [...prev];
      if (newTasks[selectedTask].data) {
        newTasks[selectedTask] = {
          ...newTasks[selectedTask],
          data: { ...newTasks[selectedTask].data, landMarks: newLandMarks },
        };
      }
      return newTasks;
    });
  };

  const handleLandMarksChange = newLandMarks => {
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
            videoURL={videoURL}
            videoData={videoData}
            videoRef={videoRef}
            screen="taskDetails"
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            taskBoxes={taskBoxes}
            fps={fps}
            persons={persons}
            setVideoReady={setVideoReady}
            setVideoData={setVideoData}
            fileName={fileName}
            landMarks={tasks[selectedTask].data?.landMarks}
            setTaskBoxes={setTaskBoxes}
            selectedTask={selectedTask}
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
            {tasks[selectedTask].data && (
              <Button variant="contained" onClick={DownloadCurrentTask} startIcon={<CloudDownload />} sx={commonButtonStyle}>
                Download
              </Button>
            )}
          </div>
          {!tasks[selectedTask].data ? (
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
          ) : (
            <PlotWidget
              selectedTaskIndex={selectedTask}
              tasks={tasks}
              setTasks={setTasks}
              fileName={fileName}
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

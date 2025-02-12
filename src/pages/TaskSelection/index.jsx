//src/pages/TaskSelection/index.jsx
import VideoPlayer from '../../components/commons/VideoPlayer/VideoPlayer';
import HeaderSection from './HeaderSection';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TaskSelectionTab from './TaskSelectionTab';
import TasksWaveForm from './TasksWaveForm';
import TaskDetails from '../TaskDetails';
import { Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { VideoContext } from '../../contexts/VideoContext';

const TaskSelection = () => {
  //Consume context instead of passing them as props 
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

  const navigate = useNavigate();

  const onTaskChange = newTask => {
    const newTasks = tasks.map(task =>
      task.id === newTask.id ? newTask : task,
    );
    setTasks(newTasks);
  };

  const onTaskDelete = deletedTask => {
    const newTasks = tasks.filter(task => task.id !== deletedTask.id);
    setTasks(newTasks);
  };

  const onNewTask = newTask => {
    const newTasks = [...tasks, newTask];
    setTasks(newTasks);
  };

  const onFPSCalculation = fps => {
    setVideoReady(true);
  };

  const moveToNextScreen = () => {
    navigate("/taskdetails");
  };

  const resetTaskSelection = () => {
    setTasksReady(false);
    setTasks([]);
  };

  return (
    <div className="flex flex-col min-h-screen max-h-screen overflow-hidden">
      <div className="flex flex-1 flex-row max-h-screen flex-wrap">
        <div className={'flex w-1/2 max-h-screen bg-red-600'}>
          <VideoPlayer
            videoURL={videoURL}
            setVideoURL={setVideoURL}
            screen={'tasks'}
            videoRef={videoRef}
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            fps={fps}
            persons={persons}
            fpsCallback={onFPSCalculation}
            setVideoReady={setVideoReady}
            setVideoData={setVideoData}
            fileName={fileName}
            setFileName={setFileName}
            taskBoxes={taskBoxes}
            setTaskBoxes={setTaskBoxes}
            videoData={videoData}
          />
        </div>
        <div className={'flex flex-col min-h-[100vh] w-1/2 '}>
          <HeaderSection
            title={'Task Selection'}
            isVideoReady={videoReady}
            fileName={fileName}
            fps={fps}
            boundingBoxes={boundingBoxes}
            taskBoxes={taskBoxes}
            moveToNextScreen={moveToNextScreen}
          />
          <TasksWaveForm
            setTasks={setTasks}
            videoRef={videoRef}
            tasks={tasks}
            isVideoReady={videoReady}
            onNewTask={onNewTask}
            onTaskChange={onTaskChange}
            tasksReady={tasksReady}
            setTasksReady={setTasksReady}
          />
          <TaskSelectionTab
            setTasks={setTasks}
            setTaskBoxes={setTaskBoxes}
            tasksReady={tasksReady}
            setBoundingBoxes={setBoundingBoxes}
            setFPS={setFPS}
            tasks={tasks}
            onTaskChange={onTaskChange}
            onTaskDelete={onTaskDelete}
            isVideoReady={videoReady}
            videoRef={videoRef}
            taskReady={tasksReady}
            setTasksReady={setTasksReady}
            resetTaskSelection={resetTaskSelection}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskSelection;

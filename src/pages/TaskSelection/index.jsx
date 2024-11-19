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
    videoData,
    setVideoData,
    fileName,
    setFileName,
    boundingBoxes,
    setBoundingBoxes,
    fps,
    setFPS,
    taskBoxes,
    setTaskBoxes,
  } = useContext(VideoContext);

  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [tasksReady, setTasksReady] = useState(false);

  //These must be created and handled by each page individually as video element dismounts on page change
  //All modified by VideoPlayer but need to be utilized by below components
  const [videoReady, setVideoReady] = useState(false);
  const [videoURL, setVideoURL] = useState(''); 
  const videoPlayerRef = useRef(null);
  

  const getBoundingRectangleForRegion = task => {
    if (
      task.hasOwnProperty('width') &&
      task.hasOwnProperty('height') &&
      task.hasOwnProperty('x') &&
      task.hasOwnProperty('y')
    ) {
      return task;
    }
    const startFrame = Math.ceil(task.start * fps);
    const endFrame = Math.floor(task.end * fps);
    let meanX = 0,
      meanY = 0,
      meanWidth = 0,
      meanHeight = 0,
      finalX = 20000,
      finalY = 20000,
      finalWidth = 0,
      finalHeight = 0;
    let total = 0;
    let finalBottom = 0,
      finalRight = 0;
    const regionFrameBoundingBoxes = [];

    for (let boundingBox of boundingBoxes) {
      if (
        boundingBox.frameNumber >= startFrame &&
        boundingBox.frameNumber <= endFrame
      )
        regionFrameBoundingBoxes.push(boundingBox);
    }

    for (let regionFrameBoundingBox of regionFrameBoundingBoxes) {
      if (regionFrameBoundingBox.hasOwnProperty('data')) {
        for (let box of regionFrameBoundingBox.data) {
          finalX = finalX > box.x ? box.x : finalX;
          finalY = finalY > box.y ? box.y : finalY;
          finalWidth = finalWidth < box.width ? box.width : finalWidth;
          finalRight =
            finalRight < box.width + box.x ? box.width + box.x : finalRight;
          finalBottom =
            finalBottom < box.height + box.y ? box.height + box.y : finalBottom;
          finalHeight = finalHeight < box.height ? box.height : finalHeight;
          //}
        }
      }
    }

    const data = {
      x: finalX,
      y: finalY,
      width: finalRight - finalX,
      height: finalBottom - finalY,
    };
    return { ...task, ...data };
  };

  useEffect(() => {
    const newTaskBoxes = [];
    for (let task of tasks) {
      newTaskBoxes.push(getBoundingRectangleForRegion(task));
    }
    setTaskBoxes(newTaskBoxes);
  }, [tasks]);

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
    setTaskBoxes(taskBoxes);
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
            taskBoxes={taskBoxes}
            videoRef={videoPlayerRef}
            boundingBoxes={boundingBoxes}
            fps={fps}
            persons={[]}
            fpsCallback={onFPSCalculation}
            setVideoReady={setVideoReady}
            // boxesReady={boxesReady}
            setVideoData={setVideoData}
            fileName={fileName}
            setFileName={setFileName}
            setTaskBoxes={setTaskBoxes}
            videoData={videoData}
          />
        </div>
        <div className={'flex flex-col min-h-[100vh] w-1/2 '}>
          <HeaderSection
            title={'Task selection'}
            isVideoReady={videoReady}
            fileName={fileName}
            fps={fps}
            boundingBoxes={boundingBoxes}
            taskBoxes={taskBoxes}
            moveToNextScreen={moveToNextScreen}
          />
          <TasksWaveForm
            setTasks={setTasks}
            videoRef={videoPlayerRef}
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
            videoRef={videoPlayerRef}
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

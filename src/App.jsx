// src/App.jsx
import VideoAnalysis from './VideoAnalysis/VideoAnalysis';
import SubjectResolution from './pages/SubjectResolution';
import { Routes, Route } from 'react-router-dom';
import TaskSelection from './pages/TaskSelection';
import TaskDetails from './pages/TaskDetails';
import TasksInfoPage from './pages/TasksInfo';
import { VideoProvider } from './contexts/VideoContext';


function App() {
  return (
    <VideoProvider>
      <Routes>
        <Route path="/" element={<SubjectResolution />} />
        <Route path="/subjects" element={<SubjectResolution />} />
        <Route path="/tasks" element={<TaskSelection />} />
        <Route path="/taskdetails" element={<TaskDetails />} />
        <Route path="/old" element={<VideoAnalysis />} />
        <Route path="/tasksInfo" element={<TasksInfoPage />} />
      </Routes>
    </VideoProvider>
  );
}

export default App;

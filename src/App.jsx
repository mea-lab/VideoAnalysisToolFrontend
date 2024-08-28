import VideoAnalysis from './VideoAnalysis/VideoAnalysis';
import SubjectResolution from './pages/SubjectResolution';
import { Routes, Route } from 'react-router-dom';
import TaskSelection from './pages/TaskSelection';
import WrapperPage from './pages/WrapperPage';
import TasksInfoPage from './pages/TasksInfo';

function App() {
  return (
    <Routes>
      <Route path="/" element={<WrapperPage page={SubjectResolution} />} />
      <Route path="/subjects" element={<SubjectResolution />} />
      <Route path="/tasks" element={<TaskSelection />} />
      <Route path="/old" element={<VideoAnalysis />} />
      <Route path="/tasksInfo" element={<TasksInfoPage />} />
    </Routes>
  );
}

export default App;

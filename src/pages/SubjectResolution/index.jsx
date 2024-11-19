// src/pages/SubjectResolution/index.jsx
import HeaderSection from './HeaderSection';
import VideoPlayer from '../../components/commons/VideoPlayer/VideoPlayer';
import SubjectSelectionTab from './SubjectSelectionTab';
import SubjectsWaveForm from './SubjectsWaveForm';
import { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoContext } from '../../contexts/VideoContext';

const SubjectResolution = () => {
  const {
    videoData,
    setVideoData,
    fileName,
    setFileName,
    boundingBoxes,
    setBoundingBoxes,
    fps,
    setFPS,
  } = useContext(VideoContext);

  const [persons, setPersons] = useState([]);
  const [boxesReady, setBoxesReady] = useState(false);

  //These must be created and handled by each page individually as video element dismounts on page change
  const [videoReady, setVideoReady] = useState(false);
  const [videoURL, setVideoURL] = useState('');
  const videoPlayerRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!videoReady) {
      setPersons([]);
      setBoundingBoxes([]);
    }
  }, [videoReady, setBoundingBoxes]);

  const checkIfSubject = (id) => {
    const person = persons.find((person) => person.id === id);
    return person && person.isSubject;
  };

  const updateFinalBoundingBoxes = () => {
    const newBoundingBoxes = boundingBoxes.map((frameBoxes) => {
      const boxes = frameBoxes.data.filter((box) => checkIfSubject(box.id));
      return { ...frameBoxes, data: boxes };
    });
    setBoundingBoxes(newBoundingBoxes);
  };

  const moveToNextScreen = () => {
    updateFinalBoundingBoxes();
    navigate('/tasks');
  };

  const onFPSCalculation = (calculatedFPS) => {
    setVideoReady(true);
    setFPS(calculatedFPS);
  };

  return (
    <div className="flex flex-col min-h-screen max-h-screen overflow-hidden">
      <div className="flex flex-1 flex-row flex-wrap">
        <div className="flex w-1/2 max-h-screen bg-red-600">
          <VideoPlayer
            videoData={videoData}
            screen="subject_resolution"
            taskBoxes={[]}
            videoRef={videoPlayerRef} // Pass local ref
            boundingBoxes={boundingBoxes}
            fps={fps}
            persons={persons}
            fpsCallback={onFPSCalculation}
            setVideoReady={setVideoReady}
            videoURL={videoURL}
            setVideoURL={setVideoURL}
            fileName={fileName}
            setFileName={setFileName}
            setVideoData={setVideoData}
          />
        </div>

        <div className="flex flex-col gap-4 min-h-[100vh] w-1/2">
          <HeaderSection
            title="Subject Selection"
            isVideoReady={videoReady}
            moveToNextScreen={moveToNextScreen}
            boundingBoxes={boundingBoxes}
            persons={persons}
            fps={fps}
            videoURL={videoURL}
            fileName={fileName}
          />
          <SubjectSelectionTab
            boundingBoxes={boundingBoxes}
            setBoundingBoxes={setBoundingBoxes}
            fps={fps}
            setFPS={setFPS}
            videoRef={videoPlayerRef}
            persons={persons}
            setPersons={setPersons}
            isVideoReady={videoReady}
            boxesReady={boxesReady}
            setBoxesReady={setBoxesReady}
          />
          <SubjectsWaveForm
            videoData={videoData}
            videoRef={videoPlayerRef}
            persons={persons}
            isVideoReady={videoReady}
            boxesReady={boxesReady}
          />
        </div>
      </div>
    </div>
  );
};

export default SubjectResolution;

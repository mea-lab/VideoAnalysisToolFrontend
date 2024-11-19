// src/contexts/VideoContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
  const [videoData, setVideoData] = useState(null);
  const [fileName, setFileName] = useState('');
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [taskBoxes, setTaskBoxes] = useState([]);
  const [fps, setFPS] = useState(60);

  return (
    <VideoContext.Provider
      value={{
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
      }}
    >
      {children}
    </VideoContext.Provider>
  );
};

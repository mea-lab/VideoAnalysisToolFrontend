// src/contexts/VideoContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';
import localforage from 'localforage';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [videoReady, setVideoReady] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [videoURL, setVideoURL] = useState("");
    const videoRef = useRef(null);
    const [fileName, setFileName] = useState('');
    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [taskBoxes, setTaskBoxes] = useState([]);
    const [fps, setFPS] = useState(60);
    const [tasks, setTasks] = useState([]);
    const [tasksReady, setTasksReady] = useState(false);
    const [persons, setPersons] = useState([]);
    const [boxesReady, setBoxesReady] = useState(false);

    useEffect(() => {
        localforage
          .getItem('videoFile')
          .then((savedFile) => {
            if (savedFile) {
              console.log('Found a saved video in localforage.');
              // This will trigger the effect that listens for videoData changes
              setVideoData(savedFile);
            }
          })
          .catch((err) => {
            console.error('Error fetching video from localforage:', err);
          });
    }, []);

    useEffect(() => {
        if (videoData) {
          localforage
            .setItem('videoFile', videoData)
            .then(() => {
              console.log('Saved video to localforage.');
    
              // Create a new object URL for the video
              const newVideoURL = URL.createObjectURL(videoData);
              setVideoURL(newVideoURL);
              setFileName(videoData.name || 'video.mp4');
              setVideoReady(true);
            })
            .catch((err) => {
              console.error('Error storing video in localforage:', err);
            });
        } else {
          // If we removed or reset the videoData, clear local states / URL
          setVideoURL('');
          setFileName('');
          setVideoReady(false);
        }
      }, [videoData]);

    return (
        <VideoContext.Provider
            value={{
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
            }}
        >
            {children}
        </VideoContext.Provider>
    );
};

// src/contexts/VideoContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';

export const VideoContext = createContext();

export const VideoProvider = ({ children }) => {
    const [videoData, setVideoData] = useState(null);
    const [videoURL, setVideoURL] = useState("");
    const [fileName, setFileName] = useState('');
    const [fps, setFPS] = useState(60);

    const [boundingBoxes, setBoundingBoxes] = useState([]);
    const [persons, setPersons] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [taskBoxes, setTaskBoxes] = useState([]);

    const [videoReady, setVideoReady] = useState(false);
    const [boxesReady, setBoxesReady] = useState(false);
    const [tasksReady, setTasksReady] = useState(false);

    const videoRef = useRef(null);
    const prevVideoDataRef = useRef(null);


    //useEffect for resetting video information if videoData is updated
    useEffect(() => {
        if (videoURL !== "") URL.revokeObjectURL(videoURL);
        if(prevVideoDataRef.current === videoData) return;
        if(videoData==null) return;
        
        //Set video information we have at start
        const newVideoURL = URL.createObjectURL(videoData);
        prevVideoDataRef.current = videoData;
        setVideoURL(newVideoURL);
        setFileName(videoData.name || 'video.mp4');

        //Reset video information we do not have
        setBoundingBoxes([]);
        setPersons([]);
        setTasks([]);
        setTasksReady(false);
        setBoxesReady(false);
        setVideoReady(false);

        return () => {
            console.log("Unmounting video context...")
            URL.revokeObjectURL(videoURL);
            setFileName("");
            setVideoURL("");
            setVideoReady(false);
        }
    },[videoData])
      
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

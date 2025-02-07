// src/contexts/VideoContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';

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
    const prevVideoDataRef = useRef(null);

    useEffect(() => {
        if(prevVideoDataRef.current === videoData) {
            return
        }
    
        if (videoURL !== "") {
            URL.revokeObjectURL(videoURL);
        }
        
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

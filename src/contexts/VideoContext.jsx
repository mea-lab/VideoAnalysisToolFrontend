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

    // const resetVideoRef = () => {
    //     if (videoRef.current) {
    //         videoRef.current.pause();
    //     }

    //     if (videoURL) {
    //         URL.revokeObjectURL(videoURL);
    //     }

    //     videoRef.current = null;
    //     setVideoReady(false);
    //     setVideoURL("");
    //     setVideoData(null);
    //     setFileName("");
    //     setBoundingBoxes([]);
    //     setTaskBoxes([]);
    //     setTasks([]);
    //     setPersons([]);
    //     setBoxesReady(false);
    // };

    useEffect(() => {
        if (!videoData) {
            videoRef.current = null;
            setFileName("");
            setVideoURL("");
            setVideoReady(false);
            return;
        }

        console.log("Setting video information");
        setFileName(videoData.name);

        const newBlobURL = URL.createObjectURL(videoData);
        setVideoURL(newBlobURL);
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

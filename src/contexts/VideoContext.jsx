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

    useEffect (() => {
        if(videoData != null) {
            setFileName(videoData.name);
            setVideoData(videoData)
            const videoURL = URL.createObjectURL(videoData);
            setVideoURL(videoURL)
        } else {
            videoRef.current = null;
            setFileName("");
            setVideoURL("");
            setVideoReady(false);
            URL.revokeObjectURL(videoURL);
        }

        return () => {
            videoRef.current = null;
            setFileName("");
            setVideoURL("");
            setVideoReady(false);
            URL.revokeObjectURL(videoURL);
        }
    }, [videoData])

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
            <video
                src={videoURL}
                ref={videoRef}
                style={{display: "none"}}
            />
            {children}
        </VideoContext.Provider>
    );
};

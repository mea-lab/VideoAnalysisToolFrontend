// src/components/commons/VideoPlayer/VideoPlayer.jsx
import React, { useEffect, useRef, useState } from 'react';
import VideoControls from './VideoControls';
import useCanvasDrawer from './useCanvasDrawer'; // adjust the import path as needed
import { Button, Slider, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const VideoPlayer = ({
  videoURL,
  setVideoURL,
  videoData,
  videoRef,
  fps,
  boundingBoxes,
  persons,
  setVideoReady,
  fileName,
  setFileName,
  setVideoData,
  screen,
  taskBoxes,
  setTaskBoxes,
  landMarks,
  setLandMarks,
  selectedTask,
  postVideoLoad,
  frameOffset,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // State for panning (dragging) the video/canvas container
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);

  // Initialize the canvas drawing hook.
  // (This hook will automatically set the canvas size and start drawing via requestVideoFrameCallback.)
  useCanvasDrawer({
    videoRef,
    canvasRef,
    boundingBoxes,
    fps,
    persons,
    screen,
    taskBoxes,
    landMarks,
    selectedTask,
    frameOffset,
  });

  const [currentFrame, setCurrentFrame] = useState(0);
  const updateFrameNumber = () => {
    if (videoRef.current) {
      const frameNumber = Math.round(fps * videoRef.current.currentTime);
      setCurrentFrame(frameNumber);
    }
  };

  useEffect(() => {

    if (videoRef.current) {
      videoRef.current.addEventListener('timeupdate', updateFrameNumber);
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', updateFrameNumber);
      }
    };
  }, [videoRef, fps, boundingBoxes]);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoData(file);
      setFileName(file.name);
      const videoUrl = URL.createObjectURL(file);
      setVideoURL(videoUrl);
    }
  };

  const resetVideo = () => {
    setVideoURL('');
    setFileName('');
    setIsPlaying(false);
    setVideoReady(false);
    if (videoRef.current) {
      videoRef.current.remove();
    }
  };

  // Drag logic for panning the video and canvas.
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const newOffsetX = e.clientX - dragStart.x;
    const newOffsetY = e.clientY - dragStart.y;
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getTotalFrameCount = () => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      return Math.round(fps * videoRef.current.duration);
    }
    return 0;
  };

  return (
    <div className="flex flex-col gap-4 p-4 justify-center items-center bg-gray-200 w-full h-full">
      {!videoURL && (
        <label>
          <input
            type="file"
            accept="video/*"
            className="opacity-0"
            onChange={handleVideoUpload}
          />
          <div className="flex justify-center p-4 rounded border border-dashed border-gray-400 hover:border-gray-500 transition-all">
            <Button variant="contained" component="span" title="Upload a video">
              Upload Video
            </Button>
          </div>
        </label>
      )}

      {videoURL && (
        <div className="flex h-full items-center px-10 w-full gap-2">
          <div className="h-full w-full flex flex-col gap-2 items-center">
            <div className="w-full flex justify-between items-center">
              <div className="flex-grow flex items-center justify-center">
                <div className="flex items-center">
                  <div className="text-lg font-semibold">{fileName}</div>
                  <IconButton color="error" onClick={resetVideo} title="Close Video">
                    <Close />
                  </IconButton>
                </div>
              </div>
              <div className="flex items-center">
                <input className="w-1/4" type="number" value={currentFrame} readOnly />
                <div>/</div>
                <div>{getTotalFrameCount()}</div>
              </div>
            </div>

            <div
              className="relative w-full h-full overflow-hidden"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <video
                src={videoURL}
                ref={videoRef}
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                  // Apply the same pan/zoom transform to both video and canvas
                  transform: `
                    translate(calc(50% + ${offset.x}px), calc(50% + ${offset.y}px))
                    translate(-50%, -50%)
                    scale(${zoomLevel})
                  `,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                }}
                onLoadedMetadata={() => {
                  setVideoReady(true);
                  if (postVideoLoad) postVideoLoad();
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                loop
              />

              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `
                    translate(calc(50% + ${offset.x}px), calc(50% + ${offset.y}px))
                    translate(-50%, -50%)
                    scale(${zoomLevel})
                  `,
                  transformOrigin: 'center center',
                }}
              />
            </div>

            <VideoControls videoRef={videoRef} isPlaying={isPlaying} fps={fps} />
          </div>

          <div className="flex flex-col items-center gap-4">
            <Slider
              orientation="vertical"
              min={1}
              max={10}
              step={0.1}
              value={zoomLevel}
              onChange={(e, value) => setZoomLevel(value)}
              aria-labelledby="Zoom"
              style={{ height: 200 }}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}x`}
            />
            <div className="font-semibold">Zoom</div>
            <button
              className="p-2 bg-gray-800 text-white rounded-md"
              onClick={() => {
                setZoomLevel(1);
                setOffset({ x: 0, y: 0 });
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

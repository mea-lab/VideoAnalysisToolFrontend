import React, { useEffect, useRef, useState } from 'react';
import VideoControls from './VideoControls';
import useCanvasDrawer from './useCanvasDrawer';
import { Button, Slider, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const VideoPlayer = ({
  videoURL,
  videoRef,
  fps,
  boundingBoxes,
  persons,
  setVideoReady,
  fileName,
  setVideoData,
  screen,
  taskBoxes,
  setTaskBoxes,
  landMarks,
  selectedTask,
  postVideoLoad,
  frameOffset,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);


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
    setTaskBoxes,
  });
  const [currentFrame, setCurrentFrame] = useState(0);


  // Update the current frame number on each animation frame.
  useEffect(() => {
    let animationFrameId;
    const updateFrameNumber = () => {
      if (videoRef.current) {
        const frameNumber = Math.round(fps * videoRef.current.currentTime);
        setCurrentFrame(frameNumber);
      }
      animationFrameId = requestAnimationFrame(updateFrameNumber);
    };
    updateFrameNumber();
    return () => cancelAnimationFrame(animationFrameId);
  }, [videoRef, fps]);


  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);


  useEffect(() => {
    if (containerSize.width && containerSize.height) {
      const maxOffsetX = ((zoomLevel - 1) * containerSize.width) / 2;
      const maxOffsetY = ((zoomLevel - 1) * containerSize.height) / 2;
      setPanOffset(prev => ({
        x: Math.max(-maxOffsetX, Math.min(prev.x, maxOffsetX)),
        y: Math.max(-maxOffsetY, Math.min(prev.y, maxOffsetY)),
      }));
    }
  }, [zoomLevel, containerSize]);


  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoData(file);
    }
  };

  
  const resetVideo = () => {
    setVideoData(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };


  const getTotalFrameCount = () => {
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      return Math.round(fps * videoRef.current.duration);
    }
    return 0;
  };


  const handlePointerDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panOffset: { ...panOffset },
      };
      e.target.setPointerCapture(e.pointerId);
    }
  };


  const handlePointerMove = (e) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    let newX = dragStartRef.current.panOffset.x + dx;
    let newY = dragStartRef.current.panOffset.y + dy;
    const maxOffsetX = ((zoomLevel - 1) * containerSize.width) / 2;
    const maxOffsetY = ((zoomLevel - 1) * containerSize.height) / 2;
    newX = Math.max(-maxOffsetX, Math.min(newX, maxOffsetX));
    newY = Math.max(-maxOffsetY, Math.min(newY, maxOffsetY));
    setPanOffset({ x: newX, y: newY });
  };


  const handlePointerUp = (e) => {
    setIsDragging(false);
    dragStartRef.current = null;
    e.target.releasePointerCapture(e.pointerId);
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
              ref={containerRef}
              className="relative w-full h-full overflow-hidden"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ touchAction: 'none' }}
            >
              <video
                src={videoURL}
                ref={videoRef}
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                }}
                onLoadedMetadata={() => setVideoReady(true)}
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
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
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
                setPanOffset({ x: 0, y: 0 });
              }}
            >
              Reset Zoom
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

// src/components/commons/VideoPlayer/VideoPlayer.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import VideoControls from './VideoControls';
import { Button, Slider, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import MarksOverlay from './MarksOverlay';
import BoxesOverlay from './BoxesOverlay';

const VideoPlayer = ({
  videoURL,
  videoRef,
  fps,
  boundingBoxes,
  setBoundingBoxes,
  persons,
  setVideoReady,
  fileName,
  setVideoData,
  screen,
  taskBoxes,
  setTaskBoxes,
  landMarks,
  selectedTask,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const canvasRef = useRef(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });
  const [frameInput, setFrameInput] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [totalFrameCount, setFrameCount] = useState(null);

  const [currentFrame, setCurrentFrame] = useState(0);
  useEffect(() => {
    if (!isEditing) {
      setFrameInput(currentFrame);
    }
  }, [currentFrame, isEditing]);

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

  // Update container size on mount and on window resize.
  const updateContainerSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
  }, []);
  useEffect(() => {
    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, [updateContainerSize]);

  // Clamp panOffset when container size or zoomLevel changes.
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

  // Called when the user uploads a new video.
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

  // Pointer events for panning.
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

  // New zoom handler that preserves the effective translation.
  const handleZoomChange = (e, value) => {
    const newZoom = value;
    // Compute the effective translation relative to the current zoom.
    const effectiveTranslation = {
      x: panOffset.x / zoomLevel,
      y: panOffset.y / zoomLevel,
    };
    // Calculate new pan offset so that the same effective translation is maintained.
    let newPan = {
      x: effectiveTranslation.x * newZoom,
      y: effectiveTranslation.y * newZoom,
    };

    // Clamp newPan to the allowed range based on the container size and new zoom.
    if (containerSize.width && containerSize.height) {
      const maxOffsetX = ((newZoom - 1) * containerSize.width) / 2;
      const maxOffsetY = ((newZoom - 1) * containerSize.height) / 2;
      newPan.x = Math.max(-maxOffsetX, Math.min(newPan.x, maxOffsetX));
      newPan.y = Math.max(-maxOffsetY, Math.min(newPan.y, maxOffsetY));
    }

    setZoomLevel(newZoom);
    setPanOffset(newPan);
  };

  return (
    <div className="flex flex-col justify-center items-center bg-gray-100 w-full h-full">
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
        <div className="h-full w-full flex flex-col">

          <div className="w-full flex flex-row items-center justify-around py-4">
            {/* Title */}
            <div className="flex items-center justify-center">
              <span className="text-lg font-semibold text-gray-800">{fileName}</span>
              <IconButton color="error" onClick={resetVideo} title="Close Video" className="ml-2">
                <Close />
              </IconButton>
            </div>
            {/* Frame Counter */}
            <div className="flex items-center space-x-1">
              <input
                className="w-24 text-center border rounded-lg px-2 py-1"
                type="text"
                value={frameInput}
                onChange={(e) => setFrameInput(e.target.value)}
                onFocus={() => setIsEditing(true)}
                onBlur={() => {
                  setIsEditing(false);
                  const newFrame = Number(frameInput);
                  if (!isNaN(newFrame) && videoRef.current) {
                    videoRef.current.currentTime = newFrame / fps;
                    setCurrentFrame(newFrame);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.target.blur();
                }}
              />
              <span className="text-gray-600">/</span>
              <span className="text-gray-800">{getTotalFrameCount()}</span>
            </div>
          </div>

          <div className="flex flex-row justify-evenly overflow-hidden relative py-2">
          <div className="flex flex-col w-[10vw]"></div>
            <div
              ref={containerRef}
              className="relative h-full overflow-hidden rounded-lg"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{touchAction: 'none' }}
            >
              <video
                src={videoURL}
                ref={videoRef}
                style={{
                  objectFit: 'contain',
                  width: '100%',
                  height: '100%',
                  opacity: 0, //video element should not show the video because it buffers, marks overlay draws it
                }}
                onLoadedMetadata={() => {
                  setVideoReady(true);
                  updateContainerSize();
                  setVideoDimensions({
                    width: videoRef.current.videoWidth,
                    height: videoRef.current.videoHeight,
                  });
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                loop
              />
              <MarksOverlay
                videoRef={videoRef}
                boundingBoxes={boundingBoxes}
                fps={fps}
                persons={persons}
                screen={screen}
                taskBoxes={taskBoxes}
                landMarks={landMarks}
                selectedTask={selectedTask}
                setTaskBoxes={setTaskBoxes}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
                  transformOrigin: 'center center',
                  background: 'transparent',
                }}
              />
              {boundingBoxes && (
                <BoxesOverlay
                  boundingBoxes={boundingBoxes}
                  setBoundingBoxes={setBoundingBoxes}
                  taskBoxes={taskBoxes}
                  setTaskBoxes={setTaskBoxes}
                  currentFrame={currentFrame}
                  persons={persons}
                  zoomLevel={zoomLevel}
                  panOffset={panOffset}
                  screen={screen}
                  videoWidth={videoDimensions.width}
                  videoHeight={videoDimensions.height}
                  selectedTask={selectedTask}
                  landMarks={landMarks}
                  fps={fps}
                  videoRef={videoRef}
                />
              )}
            </div>

            <div className="flex flex-col items-center justify-center w-[10vw]">
              <Slider
                orientation="vertical"
                min={1}
                max={10}
                step={0.1}
                value={zoomLevel}
                onChange={handleZoomChange}
                aria-labelledby="Zoom"
                style={{ height: 300, width: 5}}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}x`}
              />
              <span className="text-md font-semibold text-gray-800 mt-4">Zoom</span>
            </div>
          </div>

          <div className="flex items-center pb-4 justify-center">
            <VideoControls videoRef={videoRef} isPlaying={isPlaying} fps={fps} />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

// src/components/commons/VideoPlayer/VideoPlayer.jsx

import React, { useEffect, useRef, useState } from 'react';
import VideoControls from './VideoControls';
import { CanvasDrawer } from './CanvasDrawer';
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

  // *** NEW OR UPDATED: track dragging state + offsets ***
  // We’ll treat offset.x, offset.y as “shift from the center of the container”
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const canvasDrawerInstance = useRef(null);
  const [currentFrame, setCurrentFrame] = useState(0);

  // Create the CanvasDrawer once
  useEffect(() => {
    if (canvasRef.current && !canvasDrawerInstance.current) {
      canvasDrawerInstance.current = new CanvasDrawer(
        videoRef.current,
        canvasRef.current,
        boundingBoxes,
        fps,
        persons,
        zoomLevel,
        screen,
        taskBoxes,
        setTaskBoxes,
        selectedTask,
        landMarks,
        setLandMarks,
        frameOffset
      );
    }
  }, [
    videoRef,
    boundingBoxes,
    fps,
    persons,
    zoomLevel,
    screen,
    taskBoxes,
    setTaskBoxes,
    selectedTask,
    landMarks,
    setLandMarks,
    frameOffset,
  ]);

  // Update various properties in the CanvasDrawer when they change
  useEffect(() => {
    if (canvasDrawerInstance.current) {
      canvasDrawerInstance.current.updatePersons(persons);
      canvasDrawerInstance.current.updateSetLandMarks(setLandMarks);
      canvasDrawerInstance.current.updateLandMarks(landMarks);
      canvasDrawerInstance.current.updateTaskBoxes(taskBoxes);
      canvasDrawerInstance.current.updateFrameOffset(frameOffset);
      canvasDrawerInstance.current.updateBoundingBoxes(boundingBoxes);
      canvasDrawerInstance.current.updateSelectedTask(selectedTask);
      canvasDrawerInstance.current.updateFPS(fps);
      canvasDrawerInstance.current.handleZoom(zoomLevel);
    }
  }, [
    persons,
    setLandMarks,
    landMarks,
    taskBoxes,
    frameOffset,
    boundingBoxes,
    selectedTask,
    fps,
    zoomLevel,
  ]);

  const updateFrameNumber = () => {
    if (videoRef && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const frameNumber = Math.round(fps * currentTime);
      setCurrentFrame(frameNumber);
    }
  };

  useEffect(() => {
    if (videoRef && videoRef.current) {
      videoRef.current.addEventListener('timeupdate', updateFrameNumber);
    }
    return () => {
      if (videoRef && videoRef.current) {
        videoRef.current.removeEventListener('timeupdate', updateFrameNumber);
      }
    };
  }, [videoRef]);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoData(file);
      setFileName(file.name);
      const videoUrl = URL.createObjectURL(file);
      setVideoURL(videoUrl);
    }
  };

  const drawFrames = (now, metadata) => {
    if (now === null || metadata === null) return;

    canvasDrawerInstance.current = new CanvasDrawer(
      videoRef.current,
      canvasRef.current,
      boundingBoxes,
      fps,
      persons,
      zoomLevel,
      screen,
      taskBoxes,
      setTaskBoxes,
      selectedTask,
      landMarks,
      setLandMarks,
      frameOffset
    );

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;

    const onFrame = (now, metadata) => {
      if (now === null || metadata === null) return;
      if (videoRef.current) {
        canvasDrawerInstance.current.drawFrame(videoRef.current.currentTime);
        videoRef.current.requestVideoFrameCallback(onFrame);
      }
    };

    canvasDrawerInstance.current.drawFrame(videoRef.current.currentTime);
    videoRef.current.requestVideoFrameCallback(onFrame);
  };

  const onVideoLoad = () => {
    videoRef.current.requestVideoFrameCallback(drawFrames);
    setVideoReady(true);
    if (postVideoLoad) postVideoLoad();
  };

  const resetVideo = () => {
    setVideoURL('');
    setFileName('');
    setIsPlaying(false);
    setVideoReady(false);
    videoRef.current.remove();
  };

  // ------------------------------------------------------------------
  // Drag logic with bounding, center-based zoom
  // ------------------------------------------------------------------
  const handleMouseDown = (e) => {
    setIsDragging(true);
    // Store mouseDown position relative to current offset
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const containerRect = e.currentTarget.getBoundingClientRect();

    // Proposed new offset: how far from the center we want to move
    const newOffsetX = e.clientX - dragStart.x;
    const newOffsetY = e.clientY - dragStart.y;

    // The scaled content size
    const scaledWidth = containerRect.width * zoomLevel;
    const scaledHeight = containerRect.height * zoomLevel;

    // Half the container size
    const halfContainerWidth = containerRect.width / 2;
    const halfContainerHeight = containerRect.height / 2;

    // The content extends scaledWidth/2 beyond its center in each direction
    const halfScaledWidth = scaledWidth / 2;
    const halfScaledHeight = scaledHeight / 2;

    // We want to clamp offset.x so we don't show blank space beyond edges.
    // That means offset.x must keep the scaled content edge within containerRect.
    // e.g. left edge is container center.x - halfScaledWidth + offset.x
    // We want that left edge >= 0 => offset.x >= halfScaledWidth - halfContainerWidth
    const minOffsetX = halfContainerWidth - halfScaledWidth; // content's left edge at container's left
    const maxOffsetX = halfScaledWidth - halfContainerWidth; // content's right edge at container's right
    const minOffsetY = halfContainerHeight - halfScaledHeight;
    const maxOffsetY = halfScaledHeight - halfContainerHeight;

    // clamp
    const clampedX = Math.min(Math.max(newOffsetX, minOffsetX), maxOffsetX);
    const clampedY = Math.min(Math.max(newOffsetY, minOffsetY), maxOffsetY);

    setOffset({ x: clampedX, y: clampedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Re-clamp offset on zoom changes
  useEffect(() => {
    if (!videoRef.current) return;
    const containerRect = videoRef.current.parentNode?.getBoundingClientRect();
    if (!containerRect) return;

    const scaledWidth = containerRect.width * zoomLevel;
    const scaledHeight = containerRect.height * zoomLevel;
    const halfContainerWidth = containerRect.width / 2;
    const halfContainerHeight = containerRect.height / 2;
    const halfScaledWidth = scaledWidth / 2;
    const halfScaledHeight = scaledHeight / 2;

    const minOffsetX = halfContainerWidth - halfScaledWidth;
    const maxOffsetX = halfScaledWidth - halfContainerWidth;
    const minOffsetY = halfContainerHeight - halfScaledHeight;
    const maxOffsetY = halfScaledHeight - halfContainerHeight;

    // clamp again
    const x = Math.min(Math.max(offset.x, minOffsetX), maxOffsetX);
    const y = Math.min(Math.max(offset.y, minOffsetY), maxOffsetY);
    setOffset({ x, y });
  }, [zoomLevel]); // run again whenever zoom changes


  const getTotalFrameCount = () => {
    if (videoRef && videoRef.current) {
      const duration = videoRef.current.duration;
      if (!isNaN(duration)) {
        return Math.round(fps * duration);
      }
    }
    return 0;
  };

  return (
    <div className="flex flex-col gap-4 p-4 justify-center items-center bg-gray-200 w-full h-full">
      {videoURL === '' && (
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

      {videoURL !== '' && (
        <div className="flex h-full items-center px-10 w-full gap-2">
          <div className="h-full w-full flex flex-col gap-2 items-center">
            <div className="w-full flex justify-between items-center">
              <div className="flex justify-center items-center flex-grow">
                <div className="flex items-center justify-center">
                  <div className="text-lg font-semibold">{fileName}</div>
                  <IconButton
                    color="error"
                    onClick={resetVideo}
                    title="Close Video"
                  >
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

            {/*
              *** NEW OR UPDATED:
              We wrap video+canvas in a 'relative overflow-hidden' container
              and handle drag events on it
            */}
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
                  // *** NEW OR UPDATED: Center-based zoom
                  // 1) transform-origin is center center
                  // 2) translate to center + offset, then shift by -50%, -50% to anchor the center
                  transform: `
                    translate(
                      calc(50% + ${offset.x}px),
                      calc(50% + ${offset.y}px)
                    )
                    translate(-50%, -50%)
                    scale(${zoomLevel})
                  `,
                  transformOrigin: 'center center',
                  pointerEvents: 'none',
                }}
                onLoadedMetadata={onVideoLoad}
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

                  // *** Same transform as <video> so they're synced
                  transform: `
                    translate(
                      calc(50% + ${offset.x}px),
                      calc(50% + ${offset.y}px)
                    )
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
              onChange={(e) => {
                setZoomLevel(e.target.value);
              }}
              aria-labelledby="Zoom"
              style={{ height: 200 }}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => value + 'x'}
            />
            <div className="font-semibold">Zoom</div>
            <button
              className="p-2 bg-gray-800 text-white rounded-md"
              onClick={() => {
                setZoomLevel(1);
                setOffset({ x: 0, y: 0 }); // reset offset
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

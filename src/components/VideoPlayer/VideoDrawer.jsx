// src/components/VideoPlayer/VideoDrawer.jsx
import React, { useEffect, useRef, useCallback } from 'react';

const VideoDrawer = ({
  videoRef,
  boundingBoxes,
  fps,
  persons,
  taskBoxes,
  landMarks,
  selectedTask,
  style,
  screen = 'default',
  isPlaying,
}) => {
  const canvasRef = useRef(null);
  const currentFrame = useRef(-1);
  const lastDrawnFrame = useRef(-1);

  const getFrameNumber = useCallback(
    (timestamp) => Math.round(timestamp * fps),
    [fps]
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'destination-over';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
    }
  }, []);

  const drawVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  }, [videoRef]);

  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const boxData = boundingBoxes.find(
      (box) => box.frameNumber === currentFrame.current
    );
  
    if (boxData && boxData.data) {
      boxData.data.forEach((box) => {
        const x = Math.round(box.x) + 0.5;
        const y = Math.round(box.y) + 0.5;
        const width = Math.round(box.width);
        const height = Math.round(box.height);
  
        ctx.beginPath();
        ctx.strokeStyle = persons.find((p) => p.id === box.id && p.isSubject)
          ? 'green'
          : 'red';
        ctx.lineWidth = 10;
        ctx.rect(x, y, width, height);
        ctx.stroke();
      });
    }
  }, [boundingBoxes, persons, videoRef]);

  const drawLandMarks = useCallback(() => {
      if (!taskBoxes.length || selectedTask == null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      const currentTask = taskBoxes[selectedTask];
      const offset = Math.floor(currentTask.start * fps);
      const frameIndex = currentFrame.current - offset;
      const landMark = landMarks && landMarks[frameIndex];
      if (!landMark) return;

      ctx.fillStyle = 'red';
      if (Array.isArray(landMark) && landMark.length >= 2) {
        if (Array.isArray(landMark[0])) {
          // Multiple landmark points
          landMark.forEach(([lx, ly]) => {
            ctx.beginPath();
            ctx.arc(lx + currentTask.x - currentTask.width*0.125, ly + currentTask.y - currentTask.height*0.125, 12.5, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          // Single landmark point
          ctx.fillRect(
            landMark[0] + taskBox.x - 15,
            landMark[1] + taskBox.y - 15,
            30,
            30
          );
        }
      }
    },
    [taskBoxes, selectedTask, fps, landMarks]
  );

  // Modified drawFrame: we only draw bounding boxes when not in a taskBox time interval.
  const drawFrame = useCallback((currentTime) => {
      const video = videoRef.current;
      if (!video) return;
      const frameNumber = getFrameNumber(currentTime);
      lastDrawnFrame.current = frameNumber;
      currentFrame.current = frameNumber;

      // Clear canvas and draw the current video frame as background.
      clearCanvas();
      drawVideoFrame();

      // Check if currentTime is within any taskBox's time window.
      const inTaskTime = taskBoxes.some((task) => currentTime >= task.start && currentTime <= task.end);
      if (screen !== 'taskDetails' && !inTaskTime) {
        drawBoundingBoxes();
      }

      if (screen === 'taskDetails' && isPlaying) {
        drawLandMarks();
      }
    },
    [getFrameNumber, clearCanvas, drawVideoFrame, drawBoundingBoxes, drawLandMarks, taskBoxes, screen, videoRef, isPlaying]
  );

  // Set canvas dimensions and start the continuous render loop.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
  
    const setCanvasDimensions = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  
    if (video.readyState >= 1) {
      setCanvasDimensions();
    } else {
      video.addEventListener('loadedmetadata', setCanvasDimensions);
    }
  
    let frameCallbackId;
    const render = (now, metadata) => {
      drawFrame(metadata.mediaTime);
      frameCallbackId = video.requestVideoFrameCallback(render);
    };
  
    frameCallbackId = video.requestVideoFrameCallback(render);  
    return () => {
      video.removeEventListener('loadedmetadata', setCanvasDimensions);
      if (video.cancelVideoFrameCallback) {
        video.cancelVideoFrameCallback(frameCallbackId);
      }
    };
  }, [videoRef, drawFrame]);

  useEffect(() => {
    lastDrawnFrame.current = -1;
    if (videoRef?.current) {
      drawFrame(videoRef.current.currentTime);
    }
  }, [persons, taskBoxes, landMarks, selectedTask, screen, drawFrame, videoRef, isPlaying]);

  return <canvas ref={canvasRef} style={style} />;
};

export default VideoDrawer;

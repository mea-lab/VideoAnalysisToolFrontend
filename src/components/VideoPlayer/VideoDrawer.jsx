// src/components/commons/VideoPlayer/MarksOverlay.jsx
import React, { useEffect, useRef, useCallback } from 'react';

const VideoDrawer = ({
  videoRef,
  boundingBoxes = [],
  fps = 30,
  persons = [],
  screen = 'default',
  taskBoxes = [],
  landMarks,
  selectedTask,
  setTaskBoxes,
  style,
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
      console.log('bounding boxes', boxData);
      boxData.data.forEach((box) => {
        ctx.beginPath();
        ctx.strokeStyle = persons.find((p) => p.id === box.id && p.isSubject)
          ? 'green'
          : 'red';
        ctx.lineWidth = 8;
        ctx.rect(box.x, box.y, box.width, box.height);
        ctx.stroke();
        // Draw the ID text
        ctx.font = '32px Arial';
        ctx.fillStyle = 'yellow';
        ctx.fillText(box.id, box.x + 5, box.y - 5);
      });
    }
  }, [boundingBoxes, persons]);

  const drawTaskBoxes = useCallback(
    (currentTime) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const task = taskBoxes.find(
        (t) => currentTime >= t.start && currentTime <= t.end
      );
      if (task) {
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 8;
        ctx.rect(task.x, task.y, task.width, task.height);
        ctx.stroke();
      }
    },
    [taskBoxes]
  );

  const drawLandMarks = useCallback(
    (currentTime) => {
      if (!taskBoxes.length || selectedTask == null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Use the selected task box; assume its start time defines the frame offset for landmarks
      const currentTask = taskBoxes[selectedTask];
      const offset = Math.floor(currentTask.start * fps);
      const frameIndex = currentFrame.current - offset;
      const landMark = landMarks && landMarks[frameIndex];
      if (!landMark) return;

      // Optionally, enlarge the task box (if desired)
      const taskBox = {
        ...currentTask,
        x: Math.max(0, currentTask.x - currentTask.width * 0.125),
        y: Math.max(0, currentTask.y - currentTask.height * 0.125),
      };

      ctx.fillStyle = 'red';
      if (Array.isArray(landMark) && landMark.length >= 2) {
        if (Array.isArray(landMark[0])) {
          // Multiple landmark points
          landMark.forEach(([lx, ly]) => {
            ctx.beginPath();
            ctx.arc(lx + taskBox.x, ly + taskBox.y, 12.5, 0, Math.PI * 2);
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

  // Main draw function that ensures the video frame is drawn first,
  // then overlays (e.g. landmarks) are drawn on top.
  const drawFrame = useCallback(
    (currentTime) => {
      const video = videoRef.current;
      if (!video) return;
      const frameNumber = getFrameNumber(currentTime);
      lastDrawnFrame.current = frameNumber;
      currentFrame.current = frameNumber;

      // Clear canvas and draw the current video frame as background.
      clearCanvas();
      drawVideoFrame();

      // Draw overlay elements based on the screen mode.
      if (screen === 'tasks') {
        // Uncomment the following lines to draw bounding boxes or task boxes if needed.
        // drawBoundingBoxes();
        // drawTaskBoxes(currentTime);
      } else if (screen === 'taskDetails') {
        // Draw landmarks on top of the video frame.
        drawLandMarks(currentTime);
      } else {
        // Other overlays can be added here if needed.
        // drawBoundingBoxes();
      }
    },
    [getFrameNumber, clearCanvas, drawVideoFrame, screen, drawLandMarks]
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
      // metadata.mediaTime gives the current playback time (in seconds)
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
  

  // Redraw when external dependencies change.
  useEffect(() => {
    lastDrawnFrame.current = -1;
    const video = videoRef.current;
    if (video) {
      drawFrame(video.currentTime);
    }
  }, [persons, taskBoxes, landMarks, selectedTask, screen, drawFrame, videoRef]);

  return <canvas ref={canvasRef} style={style} />;
};

export default VideoDrawer;

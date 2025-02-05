// src/hooks/useCanvasDrawer.js
import { useEffect, useRef, useCallback } from 'react';

const useCanvasDrawer = ({
  videoRef,
  canvasRef,
  boundingBoxes = [],
  fps = 30,
  persons = [],
  screen = 'default',
  taskBoxes = [],
  landMarks,
  selectedTask,
  frameOffset = 0,
}) => {
  const currentFrame = useRef(-1);
  const lastDrawnFrame = useRef(-1);

  // Convert a video time into a frame number
  const getFrameNumber = useCallback(
    (timestamp) => Math.floor(timestamp * fps) + frameOffset,
    [fps, frameOffset]
  );

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [canvasRef]);

  const drawVideoFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  }, [videoRef, canvasRef]);

  const drawBoundingBoxes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Get bounding boxes for the current frame
    const boxData = boundingBoxes.find(
      (box) => box.frameNumber === currentFrame.current
    );
    if (boxData && boxData.data) {
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
  }, [boundingBoxes, persons, canvasRef]);

  const drawTaskBoxes = useCallback(
    (currentTime) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      // Find the task box corresponding to the current time
      const task = taskBoxes.find((t) => currentTime >= t.start && currentTime <= t.end);
      if (task) {
        ctx.beginPath();
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 8;
        ctx.rect(task.x, task.y, task.width, task.height);
        ctx.stroke();
      }
    },
    [taskBoxes, canvasRef]
  );

  const drawLandMarks = useCallback(
    (currentTime) => {
      if (!taskBoxes.length || selectedTask == null) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');

      // Use the selected task box; assume its start time defines the frame offset for landmarks
      const currentTask = taskBoxes[selectedTask];
      const offset = Math.round(currentTask.start * fps);
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
            ctx.arc(lx + taskBox.x, ly + taskBox.y, 10, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
          // Single landmark point
          ctx.fillRect(landMark[0] + taskBox.x - 15, landMark[1] + taskBox.y - 15, 30, 30);
        }
      }
    },
    [taskBoxes, selectedTask, fps, landMarks, canvasRef]
  );

  // Main draw function that selects which overlay to render.
  const drawFrame = useCallback(
    (currentTime) => {
      const video = videoRef.current;
      if (!video) return; // Do nothing if video isn't available.
      const frameNumber = getFrameNumber(currentTime);

      lastDrawnFrame.current = frameNumber;
      currentFrame.current = frameNumber;

      clearCanvas();
      drawVideoFrame();
      if (screen === 'tasks') {
        drawBoundingBoxes();
        // drawTaskBoxes(currentTime);
      } else if (screen === 'taskDetails') {
        drawBoundingBoxes();
        drawLandMarks(currentTime);
      } else {
        drawBoundingBoxes();
      }
    },
    [
      getFrameNumber,
      clearCanvas,
      drawVideoFrame,
      drawBoundingBoxes,
      drawLandMarks,
      screen,
      videoRef,
    ]
  );

  // Effect to set canvas dimensions when video metadata is available, and to trigger drawing whenever the video's time updates.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const setCanvasDimensions = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      drawFrame(video.currentTime);
    };

    if (video.readyState >= 1) {
      setCanvasDimensions();
    } else {
      video.addEventListener('loadedmetadata', setCanvasDimensions);
    }

    const handleTimeUpdate = () => {
      drawFrame(video.currentTime);
    };
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', setCanvasDimensions);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef, canvasRef, drawFrame]);

  useEffect(() => {
    lastDrawnFrame.current = -1;
    const video = videoRef.current;
    if (video) {
      drawFrame(video.currentTime);
    }
  }, [persons, taskBoxes, landMarks, selectedTask, screen, drawFrame, videoRef]);

  return { drawFrame };
};

export default useCanvasDrawer;

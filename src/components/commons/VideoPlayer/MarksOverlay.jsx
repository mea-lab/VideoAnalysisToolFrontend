import React, { useRef, useEffect, useCallback } from 'react';

//Landmarks Overlay Uses Canvas Drawer for faster draws and less laggy video synchronization
const MarksOverlay = ({
  videoRef,
  fps = 30,
  persons = [],
  screen = 'default',
  taskBoxes = [],
  landMarks,
  selectedTask,
  frameOffset = 0,
}) => {
  const canvasRef = useRef(null);
  const currentFrame = useRef(-1);
  const lastDrawnFrame = useRef(-1);
  
  const getFrameNumber = useCallback(
    (timestamp) => Math.floor(timestamp * fps) + frameOffset,
    [fps, frameOffset]
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
      
      const taskBox = {
        ...currentTask,
        x: Math.max(0, currentTask.x - currentTask.width * 0.125),
        y: Math.max(0, currentTask.y - currentTask.height * 0.125),
      };
      
      ctx.fillStyle = 'red';
      if (Array.isArray(landMark) && landMark.length >= 2) {
        if (Array.isArray(landMark[0])) {
          landMark.forEach(([lx, ly]) => {
            ctx.beginPath();
            ctx.arc(lx + taskBox.x, ly + taskBox.y, 10, 0, Math.PI * 2);
            ctx.fill();
          });
        } else {
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
  
  const drawFrame = useCallback(
    (currentTime) => {
      const video = videoRef.current;
      if (!video) return;
      const frameNumber = getFrameNumber(currentTime);
      lastDrawnFrame.current = frameNumber;
      currentFrame.current = frameNumber;
      
      clearCanvas();
      drawVideoFrame();
      if (screen === 'taskDetails') {
        drawLandMarks(currentTime);
      }
    },
    [getFrameNumber, clearCanvas, drawVideoFrame, drawLandMarks, screen, videoRef]
  );
  
  // Initialize canvas dimensions and start the animation loop.
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
    
    let animationFrameId;
    const render = () => {
      drawFrame(video.currentTime);
      animationFrameId = requestAnimationFrame(render);
    };
    render();
    
    return () => {
      video.removeEventListener('loadedmetadata', setCanvasDimensions);
      cancelAnimationFrame(animationFrameId);
    };
  }, [videoRef, drawFrame]);
  
  useEffect(() => {
    lastDrawnFrame.current = -1;
    const video = videoRef.current;
    if (video) {
      drawFrame(video.currentTime);
    }
  }, [persons, taskBoxes, landMarks, selectedTask, screen, drawFrame, videoRef]);
  
  return (
    <canvas 
    ref={canvasRef} 
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      background: 'transparent',
    }}
    />
  );
}


export default MarksOverlay;
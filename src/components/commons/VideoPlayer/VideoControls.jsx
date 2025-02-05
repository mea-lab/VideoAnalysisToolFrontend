// src/components/commons/VideoPlayer/VideoControls.jsx
import { Pause, PlayArrow } from '@mui/icons-material';
import React, { useEffect } from 'react';

const VideoControls = ({ videoRef, isPlaying, fps }) => {
  const checkVideoLoaded = () => {
    const video = videoRef.current;
    if (!video) return false;
    if (video.error) {
      console.error('Video error:', video.error.message);
      return false;
    }
    if (!video.src && !video.currentSrc) {
      console.error('No video source is set.');
      return false;
    }
    return video.readyState === 4;
  };

  const playOrPause = () => {
    if (!checkVideoLoaded()) return;
    const video = videoRef.current;
    if (video.paused) video.play();
    else video.pause();
  };

  const changeVideoTime = (offset) => {
    if (checkVideoLoaded()) {
      videoRef.current.currentTime += offset;
    }
  };

  const changeVideoFrame = (frameOffset) => {
    if (checkVideoLoaded()) {
      const timeOffset = frameOffset / fps;
      changeVideoTime(timeOffset);
    }
  };

  const handleKey = (event) => {
    if (!videoRef.current) return;
    switch (event.key) {
      case 'ArrowRight':
        changeVideoFrame(1);
        break;
      case 'ArrowLeft':
        changeVideoFrame(-1);
        break;
      case 'ArrowUp':
        changeVideoFrame(5);
        break;
      case 'ArrowDown':
        changeVideoFrame(-5);
        break;
      case ' ':
        playOrPause();
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fps, videoRef]);

  return (
    <div className="flex gap-4 text-2xl items-center">
      <button onClick={() => changeVideoFrame(-5)}>-5</button>
      <button onClick={() => changeVideoFrame(-1)}>-1</button>
      {isPlaying ? (
        <Pause className="cursor-pointer" onClick={playOrPause} />
      ) : (
        <PlayArrow className="cursor-pointer" onClick={playOrPause} />
      )}
      <button onClick={() => changeVideoFrame(1)}>+1</button>
      <button onClick={() => changeVideoFrame(5)}>+5</button>
    </div>
  );
};

export default VideoControls;

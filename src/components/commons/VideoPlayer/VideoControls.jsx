import { Pause, PlayArrow } from '@mui/icons-material';
import { useEffect, useState, useCallback } from 'react';
import { Button, Typography } from '@mui/material';
import Forward5Icon from '@mui/icons-material/Forward5';
import Replay5Icon from '@mui/icons-material/Replay5';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const VideoControls = ({ videoRef, isPlaying, fps }) => {
  const [flag] = useState(false);

  useEffect(() => {
    console.log('Flag has changed to ' + flag);
  }, [flag]);

  const checkVideoLoaded = useCallback(() => {
    if (!videoRef.current) {
      console.error('Video reference not found.');
      return false;
    }

    if (videoRef.current.error) {
      console.error(
        'Video failed to load due to an error:',
        videoRef.current.error.message,
      );
      return false;
    }

    if (!videoRef.current.src && !videoRef.current.currentSrc) {
      console.error('No video source is set.');
      return false;
    }

    if (videoRef.current.readyState === 4) {
      return true;
    } else {
      console.warn(
        'Video is not fully loaded yet. Current state:',
        videoRef.current.readyState,
      );
      return false;
    }
  }, [videoRef]);

  const playOrPause = useCallback(() => {
    if (checkVideoLoaded()) {
      if (videoRef.current.paused) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [checkVideoLoaded, videoRef]);

  const changeVideoFrame = useCallback(
    offset => {
      const changeVideoTime = offset => {
        if (checkVideoLoaded())
          videoRef.current.currentTime = videoRef.current.currentTime + offset;
      };
      if (checkVideoLoaded()) {
        const timeOffset = offset / fps;
        changeVideoTime(timeOffset);
      }
    },
    [checkVideoLoaded, fps, videoRef],
  );

  useEffect(() => {
    const handleKey = event => {
      const video = videoRef.current;

      if (!video) return;

      switch (event.key) {
        case 'ArrowRight':
          // setFlag(true);
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

    window.addEventListener('keydown', handleKey);
    // window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKey);
      // window.removeEventListener('keyup', handleKeyUp);
    };
  }, [changeVideoFrame, playOrPause, videoRef]);

  return (
    <div className={'flex gap-4 text-2xl items-center'}>
      <Button>
        <Replay5Icon onClick={() => changeVideoFrame(-5)} />
      </Button>
      <Button>
        <RemoveIcon fontSize="small" onClick={() => changeVideoFrame(-1)} />
        <Typography variant="body1">1</Typography>
      </Button>
      {isPlaying ? (
        <Pause className="cursor-pointer" onClick={playOrPause} />
      ) : (
        <PlayArrow className="cursor-pointer" onClick={playOrPause} />
      )}
      <Button>
        <AddIcon fontSize="small" onClick={() => changeVideoFrame(1)} />
        <Typography variant="body1">1</Typography>
      </Button>
      <Button>
        <Forward5Icon onClick={() => changeVideoFrame(5)} />
      </Button>
    </div>
  );
};

export default VideoControls;

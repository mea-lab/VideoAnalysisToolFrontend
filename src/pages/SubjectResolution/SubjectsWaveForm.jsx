import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import { Slider } from '@mui/material';
// import CircularProgressWithLabel from '../SubjectResolution/CircularProgressWithLabel';

const SubjectsWaveForm = ({ videoRef, persons, isVideoReady }) => {
  const waveformRef = useRef(null);
  const waveSurfer = useRef(null);

  const [loadPercent, setLoadPercent] = useState(0);
  const [waveLoading, setWaveLoading] = useState(false);
  
  // 1) onZoomChange function replicates how TasksWaveform adjusts the zoom
  const onZoomChange = (zoomLevel) => {
    if (isVideoReady && waveSurfer.current && !waveLoading) {
      const duration = videoRef.current?.duration ?? 1;
      // Adjust pxPerSec based on your desired formula
      const pxPerSec = (670 / duration) * zoomLevel;
      waveSurfer.current.zoom(pxPerSec);
    }
  };

  // 2) Factor out waveSurfer options just like in TasksWaveform
  const getWaveSurferOptions = () => {
    const duration = videoRef.current.duration;
    return {
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      cursorColor: 'navy',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 100,
      backend: 'MediaElement',
      media: videoRef.current,
      mediaType: 'video',
      normalize: true,
      // Enable scrolling & zoom
      zoom: true,
      scrollParent: true,
      // If you want the initial zoom to match the TasksWaveform logic:
      minPxPerSec: 680 / duration,
    };
  };

  useEffect(() => {
    if (!isVideoReady || !videoRef?.current) return;

    // Destroy any existing wavesurfer instance to avoid duplicates
    if (waveSurfer.current) {
      waveSurfer.current.destroy();
    }

    // Create WaveSurfer instance using your options
    waveSurfer.current = WaveSurfer.create(getWaveSurferOptions());

    waveSurfer.current.on('loading', (percent) => {
      setLoadPercent(percent);
      setWaveLoading(true);
    });

    waveSurfer.current.on('ready', () => {
      setWaveLoading(false);
    });

    return () => {
      waveSurfer.current?.destroy();
    };
  }, [isVideoReady, videoRef]);

  // 3) Once WaveSurfer is ready, we can register regions for each person
  // useEffect(() => {
  //   if (!waveSurfer.current || !persons.length) return;

  //   const wsRegions = waveSurfer.current.registerPlugin(RegionsPlugin.create());
  //   // Add read-only regions at each subject's timestamp
  //   persons.forEach((subject) => {
  //     wsRegions.addRegion({
  //       start: subject.timestamp,
  //       end: subject.timestamp + 0.001,
  //       content: subject.name,
  //       drag: false,
  //       resize: false,
  //     });
  //   });
  // }, [persons]);

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full border-t-2 pt-4 px-2">
      {isVideoReady && (
        <div className="w-full flex items-center justify-between px-8">
          <div className="font-semibold text-center">
            {waveLoading
              ? `Loading Waveform: ${Math.round(loadPercent)}%...`
              : 'Waveform'}
          </div>
          {/* 4) Zoom Slider */}
          <Slider
            orientation="horizontal"
            min={1}
            max={10}
            step={0.1}
            style={{ width: 200 }}
            onChange={(e) => onZoomChange(e.target.value)}
            aria-label="Zoom"
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}x`}
          />
        </div>
      )}
      {/* Optional: If you have a circular progress component, you can show it here */}
      {/* {isVideoReady && waveLoading && (
        <CircularProgressWithLabel value={loadPercent} size={80} />
      )} */}
      <div
        id="waveform"
        className="w-full px-8 py-2 overflow-x-scroll overflow-y-hidden"
        ref={waveformRef}
      />
    </div>
  );
};

export default SubjectsWaveForm;

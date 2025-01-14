import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import CircularProgressWithLabel from './CircularProgressWithLabel';
import { Slider } from '@mui/material';

const SubjectsWaveForm = ({ videoRef, persons, isVideoReady, boxesReady }) => {
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const [waveLoading, setWaveLoading] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (!isVideoReady || !videoRef.current) return;

    // 1) Destroy an old instance if it exists
    if (waveSurferRef.current) {
      waveSurferRef.current.setMediaElement(null);
      waveSurferRef.current.destroy();
      waveSurferRef.current = null;
    }

    // 2) Create a new WaveSurfer instance with the MediaElement backend
    waveSurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      backend: 'MediaElement',
      waveColor: 'violet',
      progressColor: 'purple',
      cursorColor: 'navy',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 100,
      normalize: true,
    });

    // 3) Attach your existing <video> element
    console.log("LOGGING VIDEO STUFF")
    console.log(videoRef.current)
    console.log(videoRef)
    videoRef.current.crossOrigin = 'anonymous'
    waveSurferRef.current.setMediaElement(videoRef.current);

    // 4) Now tell WaveSurfer to “load” (no URL needed, it will use the attached mediaElement).
    waveSurferRef.current.load();

    // 5) Hook up event listeners for debug/loading
    waveSurferRef.current.on('error', (e) => {
      console.error('WaveSurfer error:', e);
    });

    waveSurferRef.current.on('loading', (percent) => {
      setWaveLoading(true);
      setLoadPercent(percent);
    });

    waveSurferRef.current.on('ready', () => {
      setWaveLoading(false);
    });

    // 6) Cleanup on unmount (or re-run) so your <video> is not destroyed
    return () => {
      if (waveSurferRef.current) {
        // Detach the video element so WaveSurfer won’t destroy it
        waveSurferRef.current.setMediaElement(null);
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
      }
    };
  }, [isVideoReady, videoRef]);

  /**
   * Zoom
   */
  const handleZoomChange = (value) => {
    setZoomLevel(value);
    if (waveSurferRef.current && !waveLoading) {
      const duration = videoRef.current?.duration;
      if (duration) {
        const pxPerSec = (680 / duration) * value;
        waveSurferRef.current.zoom(pxPerSec);
      }
    }
  };

  return (
    <>
      <div
        id="waveform"
        className="flex w-full px-8 py-4 overflow-x-scroll overflow-y-hidden"
        ref={waveformRef}
      />
    </>
  );
};

export default SubjectsWaveForm;

//src/pages/SubjectResolution/SubjectsWaveForm.jsx
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';

const SubjectsWaveForm = ({ videoRef, persons, isVideoReady }) => {
  const waveformRef = useRef(null);
  const waveSurfer = useRef(null);

  const [loadPercent, setLoadPercent] = useState(0);
  const [waveLoading, setWaveLoading] = useState(false);

  useEffect(() => {
    if (!isVideoReady || !videoRef?.current) return;

    // Destroy any existing wavesurfer instance
    if (waveSurfer.current) {
      waveSurfer.current.destroy();
    }

    // Create wavesurfer instance
    waveSurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'violet',
      progressColor: 'purple',
      cursorColor: 'navy',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 100,
      minPxPerSec: 680 / videoRef.current.duration,
      backend: 'MediaElement',
      media: videoRef.current,
      mediaType: 'video',
      normalize: true,
      // autoScroll: false, // Removed for simplicity
    });

    waveSurfer.current.on('loading', (percent) => {
      setLoadPercent(percent);
      setWaveLoading(true);
    });

    waveSurfer.current.on('ready', () => {
      setWaveLoading(false);
    });

    return () => {
      if (waveSurfer.current) {
        waveSurfer.current.destroy();
      }
    };
  }, [isVideoReady, videoRef]);

  useEffect(() => {
    if (!waveSurfer.current || !persons.length) return;

    const wsRegions = waveSurfer.current.registerPlugin(RegionsPlugin.create());
    persons.forEach((subject) => {
      wsRegions.addRegion({
        start: subject.timestamp,
        end: subject.timestamp + 0.001,
        content: subject.name,
        drag: false,
        resize: false,
      });
    });
  }, [persons]);

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full border-t-2 pt-4 px-2">
      {isVideoReady && (
        <div className="w-full text-center mb-2 font-semibold">
          {!waveLoading
            ? 'Waveform'
            : `Loading Waveform: ${Math.round(loadPercent)}%...`}
        </div>
      )}
      <div
        id="waveform"
        className="w-full px-8 py-2 overflow-x-scroll overflow-y-hidden"
        ref={waveformRef}
      />
    </div>
  );
};

export default SubjectsWaveForm;

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/plugins/regions';
import HoverPlugin from 'wavesurfer.js/plugins/hover';
import CircularProgressWithLabel from '../SubjectResolution/CircularProgressWithLabel';
import { Slider } from '@mui/material';

const TasksWaveForm = ({
  setTasks,
  videoRef,
  tasks,
  isVideoReady,
  setTasksReady,
  tasksReady,
}) => {
  const waveformRef = useRef(null);
  const waveSurferRef = useRef(null);
  const regionsPluginRef = useRef(null);
  const ignoreRegionEventsRef = useRef(false);
  const [waveLoading, setWaveLoading] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  const [waveSurferReady, setWaveSurferReady] = useState(false);
  const tasksRef = useRef(tasks);

  const updateRegions = () => {
    if (regionsPluginRef.current) {
      
      ignoreRegionEventsRef.current = true;
      regionsPluginRef.current.clearRegions();
      tasks.forEach(task => {
        regionsPluginRef.current.addRegion({
          id: task.id,
          start: task.start,
          end: task.end,
          content: task.name,
          drag: true,
          resize: true,
        });
      });
      ignoreRegionEventsRef.current = false;
    }
  };

  useEffect(() => {
    tasksRef.current = tasks;
    if (regionsPluginRef.current && waveSurferRef.current && waveSurferReady) {
      updateRegions();
    }
  }, [tasks,waveSurferReady]);

  const getWaveSurferOptions = () => ({
    container: waveformRef.current,
    waveColor: 'violet',
    progressColor: 'purple',
    cursorColor: 'navy',
    barWidth: 2,
    barRadius: 3,
    responsive: true,
    height: 100,
    minPxPerSec: 100,
    autoScroll: true,
    normalize: true,
    media: videoRef.current,
  });

  const getHighestId = () =>
    tasksRef.current.reduce((max, t) => Math.max(max, t.id), 0);

  const handleNewRegion = (region) => {
    if (ignoreRegionEventsRef.current || region.content) return;

    const startTime = parseFloat(region.start.toFixed(3));
    const endTime = parseFloat(region.end.toFixed(3));
    const newId = getHighestId() + 1;
    const regionName = `Region ${newId}`;
    
    //Hide original region
    region.setOptions({ 
      color: 'rgba(0, 0, 0, 0.0)',
      resize: false,
    });

    const newTask = { id: newId, start: startTime, end: endTime, name: regionName };
    setTasks(prev => [...prev, newTask]);
    if (!tasksReady) setTasksReady(true);
  };

  const handleRegionUpdate = region => {
    if (ignoreRegionEventsRef.current) return;
    const startTime = parseFloat(region.start.toFixed(3));
    const endTime = parseFloat(region.end.toFixed(3));
    const taskToUpdate = tasksRef.current.find(t => t.id === region.id);
    
    if (!taskToUpdate) return;
    if (
      Math.abs(taskToUpdate.start - startTime) > 0.001 ||
      Math.abs(taskToUpdate.end - endTime) > 0.001
    ) {
      setTasks(prev =>
        prev.map(task =>
          task.id === region.id
            ? { ...task, start: startTime, end: endTime }
            : task
        )
      );
    }
  };

  useEffect(() => {
    if (!isVideoReady || !videoRef.current) return;

    if (waveSurferRef.current) {
      waveSurferRef.current.destroy();
    }

    waveSurferRef.current = WaveSurfer.create(getWaveSurferOptions());

    waveSurferRef.current.on('loading', percent => {
      setLoadPercent(percent);
      setWaveLoading(true);
    });

    waveSurferRef.current.on('ready', () => {
      setWaveLoading(false);
      setWaveSurferReady(true);
    });

    regionsPluginRef.current = waveSurferRef.current.registerPlugin(
      RegionsPlugin.create()
    );

    regionsPluginRef.current.enableDragSelection({});
    waveSurferRef.current.registerPlugin(HoverPlugin.create({}));

    regionsPluginRef.current.on('region-created', handleNewRegion);
    regionsPluginRef.current.on('region-updated', handleRegionUpdate);

    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
        setWaveSurferReady(false);
      }
    };
  }, [isVideoReady, videoRef]);

  const onZoomChange = (e, zoomLevel) => {
    if (isVideoReady && waveSurferRef.current && !waveLoading) {
      waveSurferRef.current.zoom(zoomLevel);
    }
  };

  return (
    <div className="flex flex-col gap-2 justify-center items-center w-full pt-4 px-2 max-w-screen-lg mx-auto">
      <div className="flex flex-col gap-2 justify-center items-center w-full pt-4 px-2">
        {isVideoReady && (
          <div className="flex items-center justify-between w-full">
            <div className="w-full font-semibold text-center">
              Waveform {waveLoading && 'loading ...'}
            </div>
            <Slider
              orientation="horizontal"
              min={1}
              max={100}
              step={1}
              onChange={onZoomChange}
              style={{ width: 200 }}
              aria-label="Zoom"
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${value}x`}
            />
          </div>
        )}
        {isVideoReady && waveLoading && (
          <CircularProgressWithLabel value={loadPercent} size={80} />
        )}
      </div>
      <div
        id="waveform"
        className="w-full px-8 py-4 overflow-x-scroll overflow-y-hidden"
        ref={waveformRef}
      />
    </div>
  );
};

export default TasksWaveForm;
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
  // This flag tells us when to ignore region events that occur during our own updates.
  const ignoreRegionEventsRef = useRef(false);
  const [waveLoading, setWaveLoading] = useState(false);
  const [loadPercent, setLoadPercent] = useState(0);
  // Flag indicating WaveSurfer is fully ready.
  const [waveSurferReady, setWaveSurferReady] = useState(false);
  // Always keep a current reference to tasks.
  const tasksRef = useRef(tasks);

  // This function redraws regions based solely on the tasks state.
  const updateRegions = () => {
    if (regionsPluginRef.current) {
      // Set flag to ignore events triggered by our programmatic changes.
      ignoreRegionEventsRef.current = true;
      regionsPluginRef.current.clearRegions();
      tasks.forEach(task => {
        regionsPluginRef.current.addRegion({
          id: task.id,
          start: task.start,
          end: task.end,
          content: task.name,
        });
      });
      // Allow event handling again.
      ignoreRegionEventsRef.current = false;
    }
  };

  // Whenever tasks or WaveSurfer readiness changes, update the regions.
  useEffect(() => {
    tasksRef.current = tasks;
    if (regionsPluginRef.current && waveSurferRef.current && waveSurferReady) {
      updateRegions();
    }
  }, [tasks, waveSurferReady]);

  // Create the WaveSurfer options.
  const getWaveSurferOptions = () => ({
    container: waveformRef.current,
    waveColor: 'violet',
    progressColor: 'purple',
    cursorColor: 'navy',
    barWidth: 2,
    barRadius: 3,
    responsive: true,
    height: 100,
    minPxPerSec: 680 / videoRef.current.duration,
    autoScroll: true,
    normalize: true,
    zoom: true,
    scrollParent: true,
    media: videoRef.current,
  });

  // Returns the highest id among the current tasks.
  const getHighestId = () =>
    tasksRef.current.reduce((max, t) => Math.max(max, t.id), 0);

  // Called when a region is created by a user drag.
  // We add a corresponding task and remove the temporary region.
  const handleNewRegion = region => {
    // Ignore events if we're in the middle of a programmatic update
    // or if the region already has content (i.e. created from a task).
    if (ignoreRegionEventsRef.current || region.content) return;

    const newId = getHighestId() + 1;
    const startTime = parseFloat(region.start.toFixed(3));
    const endTime = parseFloat(region.end.toFixed(3));
    const regionName = `Region ${newId}`;

    // Mark the region with our content and id.
    ignoreRegionEventsRef.current = true;
    region.setContent(regionName);
    region.setOptions({ id: newId });
    ignoreRegionEventsRef.current = false;

    // Add the new task.
    const newTask = { id: newId, start: startTime, end: endTime, name: regionName };
    setTasks(prev => [...prev, newTask]);
    if (!tasksReady) setTasksReady(true);

    // Remove the temporary region created by the drag.
    region.remove();
  };

  // Called when an existing region is updated (e.g. moved or resized).
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

  // Initialize WaveSurfer (with plugins and event handlers) when the video is ready.
  useEffect(() => {
    if (!isVideoReady || !videoRef.current) return;

    // Destroy any previous instance.
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
      waveSurferRef.current.isReady = true;
      // Signal that WaveSurfer is ready so that our effect can draw regions.
      setWaveSurferReady(true);
    });

    // Register plugins.
    regionsPluginRef.current = waveSurferRef.current.registerPlugin(
      RegionsPlugin.create()
    );
    // Enable drag selection so that the user can create a new region.
    regionsPluginRef.current.enableDragSelection();
    waveSurferRef.current.registerPlugin(HoverPlugin.create({}));

    // Attach region event listeners.
    regionsPluginRef.current.on('region-created', handleNewRegion);
    regionsPluginRef.current.on('region-updated', handleRegionUpdate);

    // Cleanup on unmount.
    return () => {
      if (waveSurferRef.current) {
        waveSurferRef.current.destroy();
        waveSurferRef.current = null;
        setWaveSurferReady(false);
      }
    };
  }, [isVideoReady, videoRef]);

  // Zoom handler for the slider.
  const onZoomChange = (e, zoomLevel) => {
    if (isVideoReady && waveSurferRef.current && !waveLoading) {
      const pxPerSec = (670 / videoRef.current.duration) * zoomLevel;
      waveSurferRef.current.zoom(pxPerSec);
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
              max={10}
              step={0.1}
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

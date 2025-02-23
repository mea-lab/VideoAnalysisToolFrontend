import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Button from '@mui/material/Button';

const WavePlotEditable = ({
  selectedTaskIndex,
  tasks,
  setTasks,
  videoRef,
  startTime,
  endTime,
  handleJSONUpload,
}) => {
  const currentData = tasks[selectedTaskIndex].data;
  
  const [videoCurrentTime, setVideoCurrentTime] = useState(startTime);
  const [blurEnd, setBlurEnd] = useState(startTime);
  const [blurStart, setBlurStart] = useState(endTime);
  const [popup, setPopup] = useState({ msg: '', show: false });
  const [alertPopup, setAlertPopup] = useState({ msg: '', show: false });
  const [taskFlags, setTaskFlags] = useState({ addNew: false, remove: false });
  const [addPointName, setAddPointName] = useState('valley_start');
  const [isMarkUp, setIsMarkUp] = useState(false);
  const [revision, setRevision] = useState(0);
  const [quickAdd, setQuickAdd] = useState({
    peakHigh: false,
    peakLowStart: false,
    peakLowEnd: false,
  });
  const [selectedPoint, setSelectedPoint] = useState({});
  const [isKeyDown, setIsKeyDown] = useState(false);
  const plotRef = useRef(null);

  const updateCurrentTaskData = (updatedData) => {
    const updatedTasks = [...tasks];
    updatedTasks[selectedTaskIndex] = {
      ...updatedTasks[selectedTaskIndex],
      data: updatedData,
    };
    setTasks(updatedTasks);
  };

  // Video event handlers
  useEffect(() => {
    const videoEl = videoRef.current;
    let frameId = null;
    const updateFrame = () => {
      if (!videoEl.paused && !videoEl.ended) {
        setVideoCurrentTime(videoEl.currentTime);
        frameId = requestAnimationFrame(updateFrame);
      }
    };
    const playHandler = () => {
      if (!frameId) frameId = requestAnimationFrame(updateFrame);
    };
    const pauseHandler = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      setVideoCurrentTime(videoEl.currentTime);
    };
    const timeUpdateHandler = () => {
      setVideoCurrentTime(videoEl.currentTime);
      setRevision((r) => r + 1);
    };
    videoEl.addEventListener('play', playHandler);
    videoEl.addEventListener('pause', pauseHandler);
    videoEl.addEventListener('ended', pauseHandler);
    videoEl.addEventListener('timeupdate', timeUpdateHandler);
    return () => {
      videoEl.removeEventListener('play', playHandler);
      videoEl.removeEventListener('pause', pauseHandler);
      videoEl.removeEventListener('ended', pauseHandler);
      videoEl.removeEventListener('timeupdate', timeUpdateHandler);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [videoRef]);

  // Key event handlers for quick-add and cancel (Escape)
  useEffect(() => {
    const keyDownHandler = (evt) => {
      if (!isKeyDown) {
        setIsKeyDown(true);
        if (evt.code === 'Escape') cancelCurrentTask();
        else if (evt.code === 'KeyQ')
          setQuickAdd((q) => ({ ...q, peakHigh: true }));
        else if (evt.code === 'KeyW')
          setQuickAdd((q) => ({ ...q, peakLowStart: true }));
        else if (evt.code === 'KeyE')
          setQuickAdd((q) => ({ ...q, peakLowEnd: true }));
      }
    };
    const keyUpHandler = (evt) => {
      setIsKeyDown(false);
      if (evt.code === 'KeyQ')
        setQuickAdd((q) => ({ ...q, peakHigh: false }));
      if (evt.code === 'KeyW')
        setQuickAdd((q) => ({ ...q, peakLowStart: false }));
      if (evt.code === 'KeyE')
        setQuickAdd((q) => ({ ...q, peakLowEnd: false }));
    };
    document.addEventListener('keydown', keyDownHandler);
    document.addEventListener('keyup', keyUpHandler);
    return () => {
      document.removeEventListener('keydown', keyDownHandler);
      document.removeEventListener('keyup', keyUpHandler);
    };
  }, [isKeyDown]);

  const cancelCurrentTask = () => {
    setPopup({ msg: '', show: false });
    setAlertPopup({ msg: '', show: false });
    setTaskFlags({ addNew: false, remove: false });
    setSelectedPoint({});
    setAddPointName('valley_start');
    resetBlur();
  };

  const resetBlur = () => {
    setBlurEnd(startTime);
    setBlurStart(endTime);
  };

  // Get the data arrays for a given point type from the current task data
  const getPointArrays = (name) => {
    if (name === 'peak values') return currentData.peaks;
    if (name === 'valley start') return currentData.valleys_start;
    if (name === 'valley end') return currentData.valleys_end;
    return { data: [], time: [] };
  };

  const findIndexForClickedPoint = (name, xVal, yVal) => {
    const { data, time } = getPointArrays(name);
    const idx = time.indexOf(xVal);
    return idx !== -1 && data[idx] === yVal ? idx : -1;
  };

  const handleSelectElementFromArray = (name, xVal) => {
    const { data, time } = getPointArrays(name);
    const idx = time.indexOf(xVal);
    if (idx >= 0) {
      setIsMarkUp(true);
      if (name === 'peak values') {
        setBlurEnd(currentData.valleys_start.time[idx]);
        setBlurStart(currentData.valleys_end.time[idx]);
      }
      return { peak_data: [data[idx]], peak_time: [time[idx]], idx, name };
    }
    return null;
  };

  const showPopUp = (msg) => setPopup({ msg, show: true });
  const getNextClosestPoint = (newX) =>
    currentData.valleys_start.time.reduce(
      (min, t) => (t > newX && t < min ? t : min),
      endTime
    );

  const validatePeak = (newX) => {
    const newValley =
      currentData.valleys_start.time[
        currentData.valleys_start.time.length - 1
      ];
    if (newX < newValley) return false;
    return !(
      currentData.peaks.time.some((pt) => pt >= newValley && pt <= newX) ||
      currentData.valleys_start.time.some((t) => t >= newValley && t <= newX) ||
      currentData.valleys_end.time.some((t) => t >= newValley && t <= newX)
    );
  };

  const validateValleyEnd = (newX) => {
    const newPeak =
      currentData.peaks.time[currentData.peaks.time.length - 1];
    if (newX < newPeak) return false;
    return !(
      currentData.peaks.time.some((pt) => pt >= newPeak && pt <= newX) ||
      currentData.valleys_start.time.some((t) => t >= newPeak && t <= newX) ||
      currentData.valleys_end.time.some((t) => t >= newPeak && t <= newX)
    );
  };

  const isBetweenValleys = (xVal) =>
    currentData.valleys_start.time.some(
      (t, i) => xVal >= t && xVal <= currentData.valleys_end.time[i]
    );

  // Main plot click handler
  const handleClickOnPlot = (data) => {
    const { x, y, data: plotData } = data.points[0];
    videoRef.current.currentTime = x;
    videoRef.current.pause();
    const name = plotData.name;

    if (!isMarkUp && taskFlags.addNew) {
      addNewPeakAndValley(data);
      return;
    }
    if (!isMarkUp && taskFlags.remove) {
      if (['peak values', 'valley start', 'valley end'].includes(name)) {
        const idx = findIndexForClickedPoint(name, x, y);
        if (idx !== -1) {
          setSelectedPoint({ idx, name });
          setPopup({ msg: '', show: false });
          setAlertPopup({
            msg: 'All points in this cycle will be removed. Are you sure?',
            show: true,
          });
        }
      }
      return;
    }
    if (!isMarkUp) {
      if (['peak values', 'valley start', 'valley end'].includes(name)) {
        const found = handleSelectElementFromArray(name, x);
        if (found) setSelectedPoint(found);
      }
      setRevision((r) => r + 1);
    } else if (isMarkUp && selectedPoint.name === 'peak values') {
      const idx = selectedPoint.idx;
      if (
        x > currentData.valleys_start.time[idx] &&
        x < currentData.valleys_end.time[idx]
      ) {
        const newPeaks = {
          data: currentData.peaks.data.map((d, i) =>
            i === idx ? y : d
          ),
          time: currentData.peaks.time.map((t, i) =>
            i === idx ? x : t
          ),
        };
        updateCurrentTaskData({ ...currentData, peaks: newPeaks });
        setSelectedPoint({});
        resetBlur();
        setIsMarkUp(false);
        setRevision((r) => r + 1);
      } else {
        showPopUp('Peak must lie within the valley start/end range.');
      }
    }
    if (quickAdd.peakHigh) {
      const newPeaks = {
        data: [...currentData.peaks.data, y],
        time: [...currentData.peaks.time, x],
      };
      updateCurrentTaskData({ ...currentData, peaks: newPeaks });
      setQuickAdd((q) => ({ ...q, peakHigh: false }));
      setRevision((r) => r + 1);
      updateRadarTable();
    } else if (quickAdd.peakLowStart) {
      const newValleyStart = {
        data: [...currentData.valleys_start.data, y],
        time: [...currentData.valleys_start.time, x],
      };
      updateCurrentTaskData({ ...currentData, valleys_start: newValleyStart });
      setQuickAdd((q) => ({ ...q, peakLowStart: false }));
      setRevision((r) => r + 1);
      updateRadarTable();
    } else if (quickAdd.peakLowEnd) {
      const newValleyEnd = {
        data: [...currentData.valleys_end.data, y],
        time: [...currentData.valleys_end.time, x],
      };
      updateCurrentTaskData({ ...currentData, valleys_end: newValleyEnd });
      setQuickAdd((q) => ({ ...q, peakLowEnd: false }));
      setRevision((r) => r + 1);
      updateRadarTable();
    }
  };

  // Cycle addition logic
  const addNewPeakAndValley = (data) => {
    const { x, y } = data.points[0];
    if (addPointName === 'valley_start') {
      if (isBetweenValleys(x)) {
        showPopUp(
          'You are trying to place a valley start that overlaps another cycle. Choose a different point.'
        );
      } else {
        const newValleyStart = {
          data: [...currentData.valleys_start.data, y],
          time: [...currentData.valleys_start.time, x],
        };
        updateCurrentTaskData({ ...currentData, valleys_start: newValleyStart });
        setAddPointName('peak');
        setBlurEnd(x);
        setBlurStart(getNextClosestPoint(x));
        showPopUp('Next, select the new peak point.');
      }
      setRevision((r) => r + 1);
    } else if (addPointName === 'peak') {
      if (validatePeak(x)) {
        const newPeaks = {
          data: [...currentData.peaks.data, y],
          time: [...currentData.peaks.time, x],
        };
        updateCurrentTaskData({ ...currentData, peaks: newPeaks });
        setAddPointName('valley_end');
        setBlurEnd(x);
        setBlurStart(getNextClosestPoint(x));
        showPopUp('Finally, select the new valley end point.');
      } else {
        showPopUp('Peak is overlapping with an existing cycle range.');
      }
      setRevision((r) => r + 1);
    } else if (addPointName === 'valley_end') {
      if (validateValleyEnd(x)) {
        const newValleyEnd = {
          data: [...currentData.valleys_end.data, y],
          time: [...currentData.valleys_end.time, x],
        };
        const updatedData = { ...currentData, valleys_end: newValleyEnd };
        updateCurrentTaskData(updatedData);
        cancelCurrentTask();
        handleJSONUpload(true, updatedData);
      } else {
        showPopUp('Valley end is overlapping with an existing cycle range.');
      }
      setRevision((r) => r + 1);
    }
  };

  // Cycle removal logic
  const removePeakAndValley = () => {
    const idx = selectedPoint.idx;
    if (idx < 0 || idx >= currentData.peaks.data.length) return;
  
    const newPeaks = {
      data: currentData.peaks.data.filter((_, i) => i !== idx),
      time: currentData.peaks.time.filter((_, i) => i !== idx),
    };
    const newValleyStart = {
      data: currentData.valleys_start.data.filter((_, i) => i !== idx),
      time: currentData.valleys_start.time.filter((_, i) => i !== idx),
    };
    const newValleyEnd = {
      data: currentData.valleys_end.data.filter((_, i) => i !== idx),
      time: currentData.valleys_end.time.filter((_, i) => i !== idx),
    };
  
    const updatedData = {
      ...currentData,
      peaks: newPeaks,
      valleys_start: newValleyStart,
      valleys_end: newValleyEnd,
    };
    // Update state with the new data
    updateCurrentTaskData(updatedData);
    handleJSONUpload(true, updatedData);
    updateRadarTable(updatedData);
    cancelCurrentTask();
    setRevision((r) => r + 1);
  };
  

  const updateRadarTable = async (dataToUse = null) => {
    try {
      const dataForUpdate = dataToUse || currentData;
      const jsonData = JSON.stringify({
        peaks_Data: dataForUpdate.peaks.data,
        peaks_Time: dataForUpdate.peaks.time,
        valleys_StartData: dataForUpdate.valleys_start.data,
        valleys_StartTime: dataForUpdate.valleys_start.time,
        valleys_EndData: dataForUpdate.valleys_end.data,
        valleys_EndTime: dataForUpdate.valleys_end.time,
        velocity_Data: dataForUpdate.velocityPlot.data,
        velocity_Time: dataForUpdate.velocityPlot.time,
      });
      const uploadData = new FormData();
      uploadData.append('json_data', jsonData);
      const response = await fetch('http://localhost:8000/api/update_plot/', {
        method: 'POST',
        body: uploadData,
      });
      if (response.ok) {
        const data = await response.json();
        const newJsonData = {
          ...dataForUpdate,
          radarTable: data,
        };
        updateCurrentTaskData(newJsonData);
        handleJSONUpload(true, newJsonData);
      } else {
        throw new Error('Server responded with an error!');
      }
    } catch (error) {
      console.error('Failed to update plot data:', error);
    }
  };
  

  const continueAlert = () => {
    setAlertPopup({ msg: '', show: false });
    removePeakAndValley();
  };

  // Define shapes for the Plotly layout using current linePlot data
  const shapes = [
    {
      type: 'line',
      x0: videoCurrentTime,
      y0: 0,
      x1: videoCurrentTime,
      y1: 1,
      xref: 'x',
      yref: 'paper',
      line: { color: 'grey', width: 1 },
      layer: 'below',
    },
    {
      type: 'rect',
      x0: startTime,
      y0: Math.min(...currentData.linePlot.data),
      x1: blurEnd,
      y1: Math.max(...currentData.linePlot.data),
      fillcolor: 'rgba(128, 128, 128, 0.4)',
      line: { width: 0 },
      layer: 'above',
    },
    {
      type: 'rect',
      x0: blurStart,
      y0: Math.min(...currentData.linePlot.data),
      x1: endTime,
      y1: Math.max(...currentData.linePlot.data),
      fillcolor: 'rgba(128, 128, 128, 0.4)',
      line: { width: 0 },
      layer: 'above',
    },
  ];

  return (
    <div className="relative flex flex-col items-center p-4">
      <div className="w-full max-w-5xl">
      <Plot
        ref={plotRef}
        data={[
          {
            y: currentData.linePlot.data,
            x: currentData.linePlot.time,
            type: 'scatter',
            mode: 'lines',
            marker: { color: '#1f77b4' },
          },
          {
            y: currentData.peaks.data,
            x: currentData.peaks.time,
            name: 'peak values',
            type: 'scatter',
            mode: 'markers',
            marker: { size: 10, color: '#41337A' },
          },
          {
            y: currentData.valleys_start.data,
            x: currentData.valleys_start.time,
            name: 'valley start',
            type: 'scatter',
            mode: 'markers',
            marker: { size: 10, color: '#76B041' },
          },
          {
            y: currentData.valleys_end.data,
            x: currentData.valleys_end.time,
            name: 'valley end',
            type: 'scatter',
            mode: 'markers',
            marker: { size: 10, color: 'red' },
          },
          {
            y: selectedPoint.peak_data,
            x: selectedPoint.peak_time,
            name: 'Selected Point',
            type: 'scatter',
            mode: 'markers',
            marker: { size: 13, color: '#01FDF6' },
          },
        ]}
        revision={revision}
        onClick={handleClickOnPlot}
        config={{
          modeBarButtonsToRemove: [
            'zoom2d',
            'select2d',
            'lasso2d',
            'resetScale2d',
          ],
          responsive: true,
          displaylogo: false,
          scrollZoom: true,
          toImageButtonOptions: {
            filename: tasks[selectedTaskIndex].fileName
              ? tasks[selectedTaskIndex].fileName + '_waveplot'
              : 'WavePlot',
          },
        }}
        layout={{
          shapes,
          dragmode: 'pan',
          xaxis: { title: 'Time [s]', range: [startTime, endTime] },
          yaxis: { title: 'Distance' },
          height: 400,
          margin: { t: 10, r: 10, b: 40, l: 50 },
          datarevision: revision,
          uirevision: true,
        }}
        style={{ width: '100%' }}
      />

      </div>
      <div className="relative w-full max-w-5xl mt-4">
        <div className="flex justify-center gap-4">
          <Button
            variant="contained"
            onClick={() => {
              setTaskFlags({ addNew: true, remove: false });
              showPopUp('Please select the new valley start point.');
            }}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1,
            }}
          >
            Add Cycle
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setTaskFlags({ addNew: false, remove: true });
              showPopUp('Please click on any point from the cycle to remove it.');
            }}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              textTransform: 'none',
              fontWeight: 'bold',
              px: 3,
              py: 1,
            }}
          >
            Remove Cycle
          </Button>
        </div>
        {popup.show && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg mt-2 w-3/4 max-w-xl z-50"
            style={{ top: '100%' }}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-800">{popup.msg}</span>
              <button
                className="font-bold ml-4 text-gray-600"
                onClick={cancelCurrentTask}
                aria-label="Close popup"
              >
                X
              </button>
            </div>
          </div>
        )}
        {alertPopup.show && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg mt-2 w-3/4 max-w-xl z-50"
            style={{ top: '100%' }}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-800">{alertPopup.msg}</span>
              <button
                className="font-bold ml-4 text-gray-600"
                onClick={cancelCurrentTask}
                aria-label="Close alert"
              >
                X
              </button>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant="contained"
                onClick={cancelCurrentTask}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={continueAlert}
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WavePlotEditable;

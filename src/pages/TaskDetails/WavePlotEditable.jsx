// src/pages/TaskDetails/WavePlotEditable
import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Button from '@mui/material/Button';

const WavePlotEditable = ({
  taskRecord,
  videoRef,
  startTime,
  endTime,
  handleJSONUpload,
}) => {
  const { linePlot, peaks, valleys_start, valleys_end } = taskRecord;

  const [plotData, setPlotData] = useState(linePlot.data);
  const [plotTimes, setPlotTimes] = useState(linePlot.time);
  const [videoCurrentTime, setVideoCurrentTime] = useState(startTime);

  const [peaksData, setPeaksData] = useState(peaks.data);
  const [peaksTimes, setPeaksTimes] = useState(peaks.time);

  const [valleysStartData, setValleysStartData] = useState(
    taskRecord.valleys_start.data
  );
  const [valleysStartTime, setValleysStartTime] = useState(
    taskRecord.valleys_start.time
  );

  const [valleysEndData, setValleysEndData] = useState(
    taskRecord.valleys_end.data
  );
  const [valleysEndTimes, setValleysEndTime] = useState(
    taskRecord.valleys_end.time
  );

  const [blurEnd, setBlurEnd] = useState(startTime);
  const [blurStart, setBlurStart] = useState(endTime);

  // Popups
  const [popupMsg, setPopupMsg] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [alertPopupMsg, setAlertPopupMsg] = useState('');
  const [showAlertPopup, setShowAlertPopup] = useState(false);

  const [addNewPoint, setAddNewPoint] = useState(false);
  const [removeCycle, setRemoveCycle] = useState(false);
  const [addPointName, setAddPointName] = useState('valley_start');

  const [isMarkUp, setIsMarkUp] = useState(false);
  const [revision, setRevision] = useState(0);

  // Quick-add flags for Q/W/E
  const [isAddNewPeakHigh, setIsAddNewPeakHigh] = useState(false);
  const [isAddNewPeakLowStart, setIsAddNewPeakLowStart] = useState(false);
  const [isAddNewPeakLowEnd, setIsAddNewPeakLowEnd] = useState(false);

  const [selectedPoint, setSelectedPoint] = useState({}); // { idx, name, peak_data, peak_time }
  const [isKeyDown, setIsKeyDown] = useState(false);

  const plotRef = useRef(null);

  // Sync up with new taskRecord if it changes
  useEffect(() => {
    setPlotData(taskRecord.linePlot.data);
    setPlotTimes(taskRecord.linePlot.time);
    setPeaksData(taskRecord.peaks.data);
    setPeaksTimes(taskRecord.peaks.time);
    setValleysStartData(taskRecord.valleys_start.data);
    setValleysStartTime(taskRecord.valleys_start.time);
    setValleysEndData(taskRecord.valleys_end.data);
    setValleysEndTime(taskRecord.valleys_end.time);

    setRevision((r) => r + 1);
  }, [taskRecord]);

  /**
   * Track current video time
   */
  useEffect(() => {
    let frameId = null;
    const videoEl = videoRef.current;

    function drawAnimationFrame() {
      if (!videoEl.paused && !videoEl.ended) {
        setVideoCurrentTime(videoEl.currentTime);
        frameId = requestAnimationFrame(drawAnimationFrame);
      }
    };

    function handlePlay() {
      if (!frameId) {
        frameId = requestAnimationFrame(drawAnimationFrame);
      }
    }

    function handlePause() {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      // Force final time update
      setVideoCurrentTime(videoEl.currentTime);
    }

    function handleTimeUpdate() {
      setVideoCurrentTime(videoEl.currentTime);
      setRevision((r) => r + 1);
    }

    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('ended', handlePause);
    videoEl.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('ended', handlePause);
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);

      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [videoRef]);

  /**
   * Keydown / keyup for Q/W/E shortcuts
   */
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isMarkUp,
    selectedPoint,
    revision,
    isAddNewPeakHigh,
    isAddNewPeakLowStart,
    isAddNewPeakLowEnd,
  ]);

  const handleKeyUp = (evt) => {
    setIsKeyDown(false);
    switch (evt.code) {
      case 'KeyQ':
        setIsAddNewPeakHigh(false);
        break;
      case 'KeyW':
        setIsAddNewPeakLowStart(false);
        break;
      case 'KeyE':
        setIsAddNewPeakLowEnd(false);
        break;
      default:
        break;
    }
  }

  const handleKeyDown = (evt) => {
    if (!isKeyDown) {
      setIsKeyDown(true);
      switch (evt.code) {
        case 'Escape':
          // Cancel selection or adding
          cancelCurrentTask();
          break;
        // Quick-add toggles
        case 'KeyQ':
          setIsAddNewPeakHigh(true);
          break;
        case 'KeyW':
          setIsAddNewPeakLowStart(true);
          break;
        case 'KeyE':
          setIsAddNewPeakLowEnd(true);
          break;
        default:
          break;
      }
    }
  };

  /**
   * Cancel any pending task (cycle creation or removal)
   */
  const cancelCurrentTask = () => {
    setShowPopup(false);
    setShowAlertPopup(false);
    setAddNewPoint(false);
    setRemoveCycle(false);
    setSelectedPoint({});
    setAddPointName('valley_start');
    resetBlurValues();
  };

  /**
   * If user is in the process of creating a new cycle but hits "Escape",
   * we remove the partially added valley(s) or peak(s).
   */
  const cancelNewCycleCreation = () => {
    if (valleysStartData.length > 0) {
      // Remove the last valleyStart
      let newValleys = [...valleysStartData];
      newValleys.pop();
      setValleysStartData(newValleys);

      let newValleyTimes = [...valleysStartTime];
      newValleyTimes.pop();
      setValleysStartTime(newValleyTimes);
    }
    if (addPointName === 'valley_end') {
      // Also remove the just-added peak
      let newPeaks = [...peaksData];
      newPeaks.pop();
      setPeaksData(newPeaks);

      let newPeakTimes = [...peaksTimes];
      newPeakTimes.pop();
      setPeaksTimes(newPeakTimes);
    }
    setRevision((r) => r + 1);
    cancelCurrentTask();
  };

  /**
   * Click on Plot
   */
  const handleClickonPlot = (data) => {
    const xVal = data.points[0].x;
    videoRef.current.currentTime = xVal;
    videoRef.current.pause();

    const name = data.points[0].data.name;

    // 1) If adding brand new cycle
    if (!isMarkUp && addNewPoint) {
      addNewPeakAndValley(data);
      return;
    }

    // 2) If removing a cycle (the user has clicked "Remove Cycle" button)
    if (!isMarkUp && removeCycle) {
      if (
        name === 'peak values' ||
        name === 'valley start' ||
        name === 'valley end'
      ) {
        // Identify index in whichever array
        const index = findIndexForClickedPoint(name, xVal, data.points[0].y);
        if (index !== -1) {
          // We'll store the selected index for removal
          setSelectedPoint({ idx: index, name });
          // Hide the instructional popup before showing the alert
          setShowPopup(false);
          // Show a final confirmation
          setAlertPopupMsg(
            'All points in this cycle will be removed. Are you sure?'
          );
          setShowAlertPopup(true);
        }
      }
      // Do not reset removeCycle yet; wait for confirm
      return;
    }

    // 3) If user is not removing, let them select a point for "markup" (move, etc.)
    if (!isMarkUp) {
      if (
        name === 'peak values' ||
        name === 'valley start' ||
        name === 'valley end'
      ) {
        // Mark the selected point
        const foundPoint = handleSelectElementfromArray(name, xVal);
        if (foundPoint) setSelectedPoint(foundPoint);
      }
      setRevision((r) => r + 1);
    } else {
      // 4) If already in "markUp" mode, possibly moving a peak
      if (selectedPoint.name === 'peak values') {
        const idx = selectedPoint.idx;
        const newX = data.points[0].x;
        // Check that new peak time is within valley start/end
        if (newX > valleysStartTime[idx] && newX < valleysEndTimes[idx]) {
          const newPeaksData = [...peaksData];
          const newPeaksTime = [...peaksTimes];
          newPeaksData[idx] = y;
          newPeaksTime[idx] = newX;
          setPeaksData(newPeaksData);
          setPeaksTimes(newPeaksTime);
          setSelectedPoint({});
          resetBlurValues();
          setIsMarkUp(false);
          setRevision((r) => r + 1);
        } else {
          showPopUp('Peak must lie within the valley start/end range.');
        }
      }
    }

    // 5) Quick-add single points for Q/W/E
    if (isAddNewPeakHigh) {
      const newPD = [...peaksData];
      const newPT = [...peaksTimes];
      newPD.push(data.points[0].y);
      newPT.push(xVal);
      setPeaksData(newPD);
      setPeaksTimes(newPT);
      setIsAddNewPeakHigh(false);
      setRevision((r) => r + 1);
      updateRadarTable();
    } else if (isAddNewPeakLowStart) {
      const newVD = [...valleysStartData];
      const newVT = [...valleysStartTime];
      newVD.push(data.points[0].y);
      newVT.push(xVal);
      setValleysStartData(newVD);
      setValleysStartTime(newVT);
      setIsAddNewPeakLowStart(false);
      setRevision((r) => r + 1);
      updateRadarTable();
    } else if (isAddNewPeakLowEnd) {
      const newVD = [...valleysEndData];
      const newVT = [...valleysEndTimes];
      newVD.push(data.points[0].y);
      newVT.push(xVal);
      setValleysEndData(newVD);
      setValleysEndTime(newVT);
      setIsAddNewPeakLowEnd(false);
      setRevision((r) => r + 1);
      updateRadarTable();
    }
  };

  /**
   * Add new valley_start -> peak -> valley_end
   */
  const addNewPeakAndValley = (data) => {
    const xVal = data.points[0].x;
    const yVal = data.points[0].y;
  
    if (addPointName === 'valley_start') {
      if (isBetweenValleys(xVal)) {
        showPopUp(
          'You are trying to place a valley start that overlaps another cycle. Choose a different point.'
        );
      } else {
        const newVD = [...valleysStartData, yVal];
        const newVT = [...valleysStartTime, xVal];
        setValleysStartData(newVD);
        setValleysStartTime(newVT);
  
        setAddPointName('peak');
        setBlurEnd(xVal);
        setBlurStart(getNextClosestPoint(xVal));
        showPopUp('Next, select the new peak point.');
      }
      setRevision((r) => r + 1);
    } else if (addPointName === 'peak') {
      if (validatePeak(xVal)) {
        const newPD = [...peaksData, yVal];
        const newPT = [...peaksTimes, xVal];
        setPeaksData(newPD);
        setPeaksTimes(newPT);
  
        setAddPointName('valley_end');
        setBlurEnd(xVal);
        setBlurStart(getNextClosestPoint(xVal));
        showPopUp('Finally, select the new valley end point.');
      } else {
        showPopUp('Peak is overlapping with an existing cycle range.');
      }
      setRevision((r) => r + 1);
    } else if (addPointName === 'valley_end') {
      if (validateValleyEnd(xVal)) {
        const newValleysEndData = [...valleysEndData, yVal];
        const newValleysEndTimes = [...valleysEndTimes, xVal];
        setValleysEndData(newValleysEndData);
        setValleysEndTime(newValleysEndTimes);
  
        const updatedTaskRecord = {
          ...taskRecord,
          peaks: { data: peaksData, time: peaksTimes },
          valleys_start: { data: valleysStartData, time: valleysStartTime },
          valleys_end: { data: newValleysEndData, time: newValleysEndTimes },
        };
  
        cancelCurrentTask();
        // Sync changes immediately
        handleJSONUpload(true, updatedTaskRecord);
      } else {
        showPopUp('Valley end is overlapping with an existing cycle range.');
      }
      setRevision((r) => r + 1);
    }
  };

  /**
   * Actually remove the entire cycle at the selectedPoint's index
   */
  const removePeakAndValley = () => {
    const idx = selectedPoint.idx;
    if (idx < 0 || idx >= peaksData.length) return;
  
    // Immutable removal
    const newPeaksData = peaksData.filter((_, i) => i !== idx);
    const newPeaksTimes = peaksTimes.filter((_, i) => i !== idx);
    const newValleysStartData = valleysStartData.filter((_, i) => i !== idx);
    const newValleysStartTimes = valleysStartTime.filter((_, i) => i !== idx);
    const newValleysEndData = valleysEndData.filter((_, i) => i !== idx);
    const newValleysEndTimes = valleysEndTimes.filter((_, i) => i !== idx);
  
    // Update local state
    setPeaksData(newPeaksData);
    setPeaksTimes(newPeaksTimes);
    setValleysStartData(newValleysStartData);
    setValleysStartTime(newValleysStartTimes);
    setValleysEndData(newValleysEndData);
    setValleysEndTime(newValleysEndTimes);
  
    // Sync with parent (fixed to pass true as first arg)
    const updatedTaskRecord = {
      ...taskRecord,
      peaks: { data: newPeaksData, time: newPeaksTimes },
      valleys_start: { data: newValleysStartData, time: newValleysStartTimes },
      valleys_end: { data: newValleysEndData, time: newValleysEndTimes }
    };
    handleJSONUpload(true, updatedTaskRecord);
  
    // Reset UI state
    cancelCurrentTask();
    setRevision(r => r + 1);
  };
  
  /**
   * Helper to identify index in the relevant array. We know `name` which
   * might be 'peak values', 'valley start', or 'valley end'.
   */
  const findIndexForClickedPoint = (name, xVal, yVal) => {
    let timesArr = [];
    let dataArr = [];

    if (name === 'peak values') {
      timesArr = peaksTimes;
      dataArr = peaksData;
    } else if (name === 'valley start') {
      timesArr = valleysStartTime;
      dataArr = valleysStartData;
    } else if (name === 'valley end') {
      timesArr = valleysEndTimes;
      dataArr = valleysEndData;
    }

    const idx = timesArr.indexOf(xVal);
    // Optionally double-check the Y if needed
    if (idx !== -1 && dataArr[idx] === yVal) {
      return idx;
    }
    return -1;
  };

  /**
   * For selecting a point in the array (for moving a peak, etc.)
   */
  const handleSelectElementfromArray = (name, xVal) => {
    let timesArr = [];
    let dataArr = [];

    if (name === 'peak values') {
      timesArr = peaksTimes;
      dataArr = peaksData;
    } else if (name === 'valley start') {
      timesArr = valleysStartTime;
      dataArr = valleysStartData;
    } else if (name === 'valley end') {
      timesArr = valleysEndTimes;
      dataArr = valleysEndData;
    }

    const idx = timesArr.indexOf(xVal);
    if (idx >= 0) {
      setIsMarkUp(true);
      if (name === 'peak values') {
        setBlurEnd(valleysStartTime[idx]);
        setBlurStart(valleysEndTimes[idx]);
      }
      return {
        peak_data: [dataArr[idx]],
        peak_time: [timesArr[idx]],
        idx,
        name,
      };
    }
    return null;
  };

  const showPopUp = (msg) => {
    setPopupMsg(msg);
    setShowPopup(true);
  };

  const closePopup = () => {
    // Instead of simply closing the popup, cancel the current task.
    cancelCurrentTask();
  };

  const resetBlurValues = () => {
    setBlurEnd(startTime);
    setBlurStart(endTime);
  };

  const getNextClosestPoint = (newX) => {
    // Find the next valleyStartTime that is > newX
    let minTime = endTime;
    for (let i = 0; i < valleysStartTime.length; i++) {
      if (valleysStartTime[i] > newX && valleysStartTime[i] < minTime) {
        minTime = valleysStartTime[i];
      }
    }
    return minTime;
  };

  const validatePeak = (newX) => {
    let newValleyStart = valleysStartTime[valleysStartTime.length - 1];
    if (newX < newValleyStart) return false;
    for (let i = 0; i < peaksTimes.length; i++) {
      if (
        (peaksTimes[i] >= newValleyStart && peaksTimes[i] <= newX) ||
        (valleysStartTime[i] >= newValleyStart &&
          valleysStartTime[i] <= newX) ||
        (valleysEndTimes[i] >= newValleyStart &&
          valleysEndTimes[i] <= newX)
      ) {
        return false;
      }
    }
    return true;
  };

  const validateValleyEnd = newX => {
    const newPeak = peaksTimes[peaksTimes.length - 1];
    if (newX < newPeak) return false;
    for (let i = 0; i < valleysEndTimes.length; i++) {
      if (
        (peaksTimes[i] >= newPeak && peaksTimes[i] <= newX) ||
        (valleysStartTime[i] >= newPeak && valleysStartTime[i] <= newX) ||
        (valleysEndTimes[i] >= newPeak && valleysEndTimes[i] <= newX)
      ) {
        return false;
      }
    }
    return true;
  };

  const isBetweenValleys = (xVal) => {
    for (let i = 0; i < valleysStartTime.length; i++) {
      if (xVal >= valleysStartTime[i] && xVal <= valleysEndTimes[i]) {
        return true;
      }
    }
    return false;
  };

  /**
   * POST updated arrays to your server, then store returned data in radarTable
   */
  const updateRadarTable = async () => {
    try {
      const jsonData = JSON.stringify({
        peaks_Data: peaksData,
        peaks_Time: peaksTimes,
        valleys_StartData: valleysStartData,
        valleys_StartTime: valleysStartTime,
        valleys_EndData: valleysEndData,
        valleys_EndTime: valleysEndTimes,
        velocity_Data: velocityData,
        velocity_Time: velocityTime,
      });
      const uploadData = new FormData();
      uploadData.append('json_data', jsonData);
      const response = await fetch('http://localhost:8000/api/update_plot/', {
        method: 'POST',
        body: uploadData,
      });
      if (response.ok) {
        const data = await response.json();
        let newJsonData = { ...taskRecord };

        // ---------------------------------------------------------------------
        // CRITICAL FIX: Also update 'peaks', 'valleys_start', and 'valleys_end'
        // so the parent’s "taskRecord" remains in sync and doesn’t revert.
        // ---------------------------------------------------------------------
        newJsonData.peaks = { data: peaksData, time: peaksTimes };
        newJsonData.valleys_start = {
          data: valleysStartData,
          time: valleysStartTime,
        };
        newJsonData.valleys_end = {
          data: valleysEndData,
          time: valleysEndTimes,
        };

        newJsonData['radarTable'] = data;
        handleJSONUpload(true, newJsonData);
      } else {
        throw new Error('Server responded with an error!');
      }
    } catch (error) {
      console.error('Failed to update plot data:', error);
    }
  };

  /**
   * Called when user hits "Continue" in the removal alert popup
   */
  const continueAlert = () => {
    setShowAlertPopup(false);
    removePeakAndValley();
  };

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
      y0: Math.min(...plotData),
      x1: blurEnd,
      y1: Math.max(...plotData),
      fillcolor: 'rgba(128, 128, 128, 0.4)',
      line: { width: 0 },
      layer: 'above',
    },
    {
      type: 'rect',
      x0: blurStart,
      y0: Math.min(...plotData),
      x1: endTime,
      y1: Math.max(...plotData),
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
              y: plotData,
              x: plotTimes,
              type: 'scatter',
              mode: 'lines',
              marker: {
                color: '#1f77b4',
              },
            },
            {
              y: peaksData,
              x: peaksTimes,
              name: 'peak values',
              type: 'scatter',
              mode: 'markers',
              marker: { size: 10, color: '#41337A' },
            },
            {
              y: valleysStartData,
              x: valleysStartTime,
              name: 'valley start',
              type: 'scatter',
              mode: 'markers',
              marker: { size: 10, color: '#76B041' },
            },
            {
              y: valleysEndData,
              x: valleysEndTimes,
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
          onClick={handleClickonPlot}
          config={{
            modeBarButtonsToRemove: ['zoom2d', 'select2d', 'lasso2d', 'resetScale2d'],
            responsive: true,
            displaylogo: false,
            toImageButtonOptions: {
              filename: taskRecord.fileName
                ? taskRecord.fileName + '_waveplot'
                : 'WavePlot',
            },
          }}
          layout={{
            shapes: shapes,
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

      {/* Wrap buttons + popups in a relative container so popups can be absolutely positioned below */}
      <div className="relative w-full max-w-5xl mt-4">
        {/* Button row */}
        <div className="flex justify-center gap-4">
          <Button
            variant="contained"
            onClick={() => {
              setShowAddButton(false);
              setAddNewPoint(true);
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
              setRemoveCycle(true);
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

        {/* Informational popup (for instructions, etc.) */}
        {showPopup && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg mt-2 w-3/4 max-w-xl z-50"
            style={{ top: '100%' }}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-800">{popupMsg}</span>
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

        {/* Alert popup (Confirm remove) */}
        {showAlertPopup && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg mt-2 w-3/4 max-w-xl z-50"
            style={{ top: '100%' }}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-800">{alertPopupMsg}</span>
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

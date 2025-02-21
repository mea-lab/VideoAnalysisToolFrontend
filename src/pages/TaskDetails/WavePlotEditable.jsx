import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Button from '@mui/material/Button';

const WavePlotEditable = ({
  taskRecord,
  videoRef,
  onClose,
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

  const [valleysStartData, setValleysStartData] = useState(valleys_start.data);
  const [valleysStartTime, setValleysStartTime] = useState(valleys_start.time);

  const [valleysEndData, setValleysEndData] = useState(valleys_end.data);
  const [valleysEndTimes, setValleysEndTime] = useState(valleys_end.time);

  const [velocityData] = useState(taskRecord.velocity_Data);
  const [velocityTime] = useState(taskRecord.velocity_Time);

  const [blurEnd, setBlurEnd] = useState(startTime);
  const [blurStart, setBlurStart] = useState(endTime);

  const [popupMsg, setPopupMsg] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [alertPopupMsg, setAlertPopupMsg] = useState('');
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [alertAgreed, setAlertAgreed] = useState(false);

  const [addNewPoint, setAddNewPoint] = useState(false);
  const [removeCycle, setRemoveCycle] = useState(false);
  const [addPointName, setAddPointName] = useState('valley_start');

  const [isMarkUp, setIsMarkUp] = useState(false);
  const [revision, setRevision] = useState(0);
  const [isAddNewPeakHigh, setIsAddNewPeakHigh] = useState(false);
  const [isAddNewPeakLowStart, setIsAddNewPeakLowStart] = useState(false);
  const [isAddNewPeakLowEnd, setIsAddNewPeakLowEnd] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState({});

  const [isKeyDown, setIsKeyDown] = useState(false);
  const [showAddButton, setShowAddButton] = useState(true);

  const plotRef = useRef(null);

  const incrementRevision = () => setRevision(prev => prev + 1);

  // Helper to remove element at index from an array
  const removeAtIndex = (arr, idx) => {
    const newArr = [...arr];
    newArr.splice(idx, 1);
    return newArr;
  };

  // Helper to remove cycle points at given index
  const removeCycleAtIndex = idx => {
    setPeaksData(removeAtIndex(peaksData, idx));
    setPeaksTimes(removeAtIndex(peaksTimes, idx));
    setValleysStartData(removeAtIndex(valleysStartData, idx));
    setValleysStartTime(removeAtIndex(valleysStartTime, idx));
    setValleysEndData(removeAtIndex(valleysEndData, idx));
    setValleysEndTime(removeAtIndex(valleysEndTimes, idx));
  };

  // Effect to update state when taskRecord prop changes
  useEffect(() => {
    setPlotData(taskRecord.linePlot.data);
    setPlotTimes(taskRecord.linePlot.time);
    setPeaksData(taskRecord.peaks.data);
    setPeaksTimes(taskRecord.peaks.time);
    setValleysStartData(taskRecord.valleys_start.data);
    setValleysStartTime(taskRecord.valleys_start.time);
    setValleysEndData(taskRecord.valleys_end.data);
    setValleysEndTime(taskRecord.valleys_end.time);
    incrementRevision();
  }, [taskRecord]);

  // 1) Use requestAnimationFrame to track current video time when playing
  useEffect(() => {
    let frameId = null;

    function drawAnimationFrame() {
      if (!videoRef.current.paused && !videoRef.current.ended) {
        setVideoCurrentTime(videoRef.current.currentTime);
        frameId = requestAnimationFrame(drawAnimationFrame);
      }
    };

    const handlePlay = () => {
      if (!frameId) frameId = requestAnimationFrame(drawAnimationFrame);
    };
    const handlePause = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
      // Ensure final time is set on pause
      setVideoCurrentTime(videoRef.current.currentTime);
    };

    const videoElement = videoRef.current;
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handlePause);

    // 2) ALSO listen for any time changes (e.g. user seeks, arrow keys, etc.)
    const handleTimeUpdate = () => {
      setVideoCurrentTime(videoElement.currentTime);
      // Force re-render of the plot shapes:
      setRevision((r) => r + 1);
    };
    videoElement.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handlePause);

      videoElement.removeEventListener('timeupdate', handleTimeUpdate);

      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [videoRef]);

  // Keydown / Keyup handlers
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

  const handleKeyUp = event => {
    setIsKeyDown(false);
    switch (event.code) {
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

  const handleKeyDown = (event) => {
    if (!isKeyDown) {
      setIsKeyDown(true);
      switch (event.code) {
        case 'KeyR':
          if (isMarkUp) {
            if (!alertAgreed) {
              setAlertPopupMsg(
                'On removing this point, the valley start, peak and valley end related to that point will also be removed. Continue?'
              );
              setShowAlertPopup(true);
              break;
            }
            if (['peak values', 'valley start', 'valley end'].includes(selectedPoint.name)) {
              removeCycleAtIndex(selectedPoint.idx);
              setShowAddButton(true);
              setAlertAgreed(false);
            }
            setSelectedPoint({});
            setIsMarkUp(false);
            resetBlurValues();
            incrementRevision();
          }
          break;
        case 'Escape':
          if (isMarkUp) {
            setSelectedPoint({});
            resetBlurValues();
            setIsMarkUp(false);
            incrementRevision();
          }
          if (!isMarkUp && addNewPoint) {
            setValleysStartData(valleysStartData.slice(0, -1));
            setValleysStartTime(valleysStartTime.slice(0, -1));
            if (addPointName === 'valley_end') {
              setPeaksData(peaksData.slice(0, -1));
              setPeaksTimes(peaksTimes.slice(0, -1));
            }
            incrementRevision();
            closePopup();
            setAddNewPoint(false);
            setShowAddButton(true);
            resetBlurValues();
            setAddPointName('valley_start');
          }
          break;
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

  const keyUpListener = event => {
    if (event.isComposing || event.code === '229') return;
    handleKeyUp(event);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', keyUpListener);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', keyUpListener);
    };
  }, [isMarkUp, selectedPoint, revision, isAddNewPeakHigh, isAddNewPeakLowStart, isAddNewPeakLowEnd]);

  const handleClickonPlot = (data) => {
    // Sync video with clicked time
    videoRef.current.currentTime = data.points[0].x;
    videoRef.current.pause();

    if (!isMarkUp && addNewPoint) {
      addNewPeakAndValley(data);
      return;
    }

    if (!isMarkUp) {
      const { name } = plotDatum;
      if (name === 'peak values' && peaksData.includes(y) && peaksTimes.includes(x)) {
        setSelectedPoint(handleSelectElementfromArray(peaksData, peaksTimes, x, name));
      } else if (name === 'valley start' && valleysStartData.includes(y) && valleysStartTime.includes(x)) {
        setSelectedPoint(handleSelectElementfromArray(valleysStartData, valleysStartTime, x, name));
      } else if (name === 'valley end' && valleysEndData.includes(y) && valleysEndTimes.includes(x)) {
        setSelectedPoint(handleSelectElementfromArray(valleysEndData, valleysEndTimes, x, name));
      }
      if (removeCycle) {
        setAlertPopupMsg('All the points in the cycle will be removed. Click again to confirm.');
        setShowAlertPopup(true);
      }
      incrementRevision();
    } else if (isAddNewPeakHigh) {
      setPeaksData([...peaksData, y]);
      setPeaksTimes([...peaksTimes, x]);
      incrementRevision();
      updateRadarTable();
    } else if (isAddNewPeakLowStart) {
      setValleysStartData([...valleysStartData, y]);
      setValleysStartTime([...valleysStartTime, x]);
      incrementRevision();
      updateRadarTable();
    } else if (isAddNewPeakLowEnd) {
      setValleysEndData([...valleysEndData, y]);
      setValleysEndTime([...valleysEndTimes, x]);
      incrementRevision();
      updateRadarTable();
    } else if (isMarkUp) {
      if (selectedPoint.name === 'peak values') {
        const idx = selectedPoint.idx;
        const newX = x;
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
          incrementRevision();
        } else {
          showPopUp('Peak must lie within the valley start/end range.');
        }
      }
    }
  };

  const addNewPeakAndValley = data => {
    const { x: xVal, y: yVal } = data.points[0];
    if (addPointName === 'valley_start') {
      if (isBetweenValleys(xVal)) {
        showPopUp('You are trying to place a valley start that overlaps another cycle. Choose a different point.');
      } else {
        setValleysStartData([...valleysStartData, yVal]);
        setValleysStartTime([...valleysStartTime, xVal]);
        setAddPointName('peak');
        setBlurEnd(xVal);
        setBlurStart(getNextClosestPoint(xVal));
        showPopUp('Next, select the new peak point.');
      }
      incrementRevision();
    } else if (addPointName === 'peak') {
      if (validatePeak(xVal)) {
        setPeaksData([...peaksData, yVal]);
        setPeaksTimes([...peaksTimes, xVal]);
        setAddPointName('valley_end');
        setBlurEnd(xVal);
        setBlurStart(getNextClosestPoint(xVal));
        showPopUp('Finally, select the new valley end point.');
      } else {
        showPopUp('Peak is overlapping with an existing cycle range.');
      }
      incrementRevision();
    } else if (addPointName === 'valley_end') {
      if (validateValleyEnd(xVal)) {
        setValleysEndData([...valleysEndData, yVal]);
        setValleysEndTime([...valleysEndTimes, xVal]);
        closePopup();
        setAddNewPoint(false);
        setShowAddButton(true);
        resetBlurValues();
        setAddPointName('valley_start');
        updateRadarTable();
      } else {
        showPopUp('Valley end is overlapping with an existing cycle range.');
      }
      incrementRevision();
    }
  };

  const removePeakAndValley = () => {
    removeCycleAtIndex(selectedPoint.idx);
    setSelectedPoint({});
    resetBlurValues();
    setIsMarkUp(false);
    setRemoveCycle(false);
  };

  const showPopUp = (msg) => {
    setPopupMsg(msg);
    setShowPopup(true);
  };

  const closePopup = () => setShowPopup(false);

  const resetBlurValues = () => {
    setBlurEnd(startTime);
    setBlurStart(endTime);
    closePopup();
  };

  const getNextClosestPoint = newX => {
    const nextPoints = valleysStartTime.filter(t => t > newX);
    return nextPoints.length ? Math.min(...nextPoints) : endTime;
  };

  const validatePeak = newX => {
    const newValleyStart = valleysStartTime[valleysStartTime.length - 1];
    if (newX < newValleyStart) return false;
    return !peaksTimes.some((pt, i) =>
      (pt >= newValleyStart && pt <= newX) ||
      (valleysStartTime[i] >= newValleyStart && valleysStartTime[i] <= newX) ||
      (valleysEndTimes[i] >= newValleyStart && valleysEndTimes[i] <= newX)
    );
  };

  const validateValleyEnd = newX => {
    const newPeak = peaksTimes[peaksTimes.length - 1];
    if (newX < newPeak) return false;
    return !valleysEndTimes.some((vet, i) =>
      (peaksTimes[i] >= newPeak && peaksTimes[i] <= newX) ||
      (valleysStartTime[i] >= newPeak && valleysStartTime[i] <= newX) ||
      (vet >= newPeak && vet <= newX)
    );
  };

  const isBetweenValleys = newX =>
    valleysStartTime.some((start, i) => newX >= start && newX <= valleysEndTimes[i]);

  const handleSelectElementfromArray = (arrayValues, arrayTimes, element, name) => {
    if (!isMarkUp) {
      setIsMarkUp(true);
      const idx = arrayTimes.indexOf(element);
      if (name === 'peak values') {
        setBlurEnd(valleysStartTime[idx]);
        setBlurStart(valleysEndTimes[idx]);
      }
      return { peak_data: [arrayValues[idx]], peak_time: [arrayTimes[idx]], idx, name };
    }
  };

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
      if (!response.ok) throw new Error('Server responded with an error!');
      const data = await response.json();
      const newJsonData = { ...taskRecord, radarTable: data };
      handleJSONUpload(true, newJsonData);
    } catch (error) {
      console.error('Failed to update plot data:', error);
    }
  };

  const continueAlert = () => {
    setAlertAgreed(true);
    setShowAlertPopup(false);
    if (removeCycle) removePeakAndValley();
    resetBlurValues();
    incrementRevision();
    updateRadarTable();
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
    <div className="relative flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <Plot
          ref={plotRef}
          data={[
            {
              y: plotData,
              x: plotTimes,
              type: 'scatter',
              mode: 'lines',
              marker: { color: '#1f77b4', width: 5 },
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
          onClick={(data) => handleClickonPlot(data)}
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
            responsive: true,
            autosize: false,
            height: 400,
            margin: { t: 10, r: 10, b: 40, l: 50 },
            datarevision: revision,
            uirevision: true,
          }}
        />
      </div>

      {/* Button row */}
      <div className="flex justify-center gap-4 mt-4">
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
            showPopUp('Please click on any point from the cycle to remove it.');
            setRemoveCycle(true);
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
      {showAlertPopup && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white w-1/2 rounded-lg shadow-lg p-6">
            <span className="block mb-4">{alertPopupMsg}</span>
            <div className="flex justify-center gap-4">
              <Button
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                onClick={() => setShowAlertPopup(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                onClick={continueAlert}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}
      {showPopup && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-300 hover:bg-gray-400 p-4 rounded-lg shadow-md w-3/4 max-w-xl">
          <span>{popupMsg}</span>
        </div>
      )}
    </div>
  );
};

export default WavePlotEditable;

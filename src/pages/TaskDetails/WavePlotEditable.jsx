// src/pages/TaskDetails/WavePlotEditable.jsx
import React, { useState, useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import Button from '@mui/material/Button'; // <--- import MUI Button

const WavePlotEditable = ({
  taskRecord,
  videoRef,
  onClose,
  startTime,
  endTime,
  handleJSONUpload,
}) => {
  const [plotData, setPlotdata] = useState(taskRecord.linePlot.data);
  const [plotTimes, setPlotTimes] = useState(taskRecord.linePlot.time);
  const [videoCurrentTime, setVideoCurrentTime] = useState(startTime);

  const [velocityData, setVelocityData] = useState(taskRecord.velocityPlot.data);
  const [velocityTime, setVelocityTime] = useState(taskRecord.velocityPlot.time);

  const [peaksData, setPeaksData] = useState(taskRecord.peaks.data);
  const [peaksTimes, setPeaksTimes] = useState(taskRecord.peaks.time);

  const [valleysStartData, setValleysStartData] = useState(
    taskRecord.valleys_start.data,
  );
  const [valleysStartTime, setValleysStartTime] = useState(
    taskRecord.valleys_start.time,
  );

  const [valleysEndData, setValleysEndData] = useState(
    taskRecord.valleys_end.data,
  );
  const [valleysEndTimes, setValleysEndTime] = useState(
    taskRecord.valleys_end.time,
  );

  const [blurEnd, setBlurEnd] = useState(startTime);
  const [blurStart, setBlurStart] = useState(endTime);

  const [popupMsg, setPopupMsg] = useState('');
  const [showPopup, setShowPopup] = useState(false);

  const [alertPopupMsg, setAlertPopupMsg] = useState('');
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [alertAgreed, setAlertAgreed] = useState(false);

  const [addNewPoint, setAddNewPoint] = useState(false);
  const [removeCycle, setRemoveCycle] = useState(false);
  const [showAddButton, setShowAddButton] = useState(false);
  const [addPointName, setAddPointName] = useState('valley_start');

  const [isMarkUp, setIsMarkUp] = useState(false);
  const [revision, setRevision] = useState(0);
  const [isAddNewPeakHigh, setIsAddNewPeakHigh] = useState(false);
  const [isAddNewPeakLowStart, setIsAddNewPeakLowStart] = useState(false);
  const [isAddNewPeakLowEnd, setIsAddNewPeakLowEnd] = useState(false);
  const [isViewinPlot, setIsViewinPlot] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState({});

  const [isKeyDown, setIsKeyDown] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const plotRef = useRef(null);

  // Effect to update state when taskRecord prop changes
  useEffect(() => {
    setPlotdata(taskRecord.linePlot.data);
    setPlotTimes(taskRecord.linePlot.time);

    setPeaksData(taskRecord.peaks.data);
    setPeaksTimes(taskRecord.peaks.time);

    setValleysStartData(taskRecord.valleys_start.data);
    setValleysStartTime(taskRecord.valleys_start.time);

    setValleysEndData(taskRecord.valleys_end.data);
    setValleysEndTime(taskRecord.valleys_end.time);

    setRevision(revision + 1);
  }, [taskRecord]);

  // Track current video time
  useEffect(() => {
    let frameId = null;
    function drawAnimationFrame() {
      if (!videoRef.current.paused && !videoRef.current.ended) {
        setVideoCurrentTime(videoRef.current.currentTime);
        frameId = requestAnimationFrame(drawAnimationFrame);
      }
    }

    const handlePlay = () => {
      if (!frameId) {
        frameId = requestAnimationFrame(drawAnimationFrame);
      }
    };
    const handlePause = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const videoElement = videoRef.current;
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handlePause);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handlePause);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [videoRef]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', event => {
      if (event.isComposing || event.code === 229) return;
      handleKeyUp(event);
    });
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleKeyDown);
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
  };

  const handleKeyDown = event => {
    if (!isKeyDown) {
      setIsKeyDown(true);
      switch (event.code) {
        case 'KeyR':
          if (isMarkUp) {
            if (!alertAgreed) {
              setAlertPopupMsg(
                'On removing this point, the valley start, peak and valley end related to that point will also be removed. Continue?',
              );
              setShowAlertPopup(true);
              break;
            }
            if (
              selectedPoint.name === 'peak values' ||
              selectedPoint.name === 'valley start' ||
              selectedPoint.name === 'valley end'
            ) {
              // Remove the entire set for the cycle
              let newPeaksData = [...peaksData];
              let newPeaksTimes = [...peaksTimes];
              newPeaksData.splice(selectedPoint.idx, 1);
              newPeaksTimes.splice(selectedPoint.idx, 1);

              let newValleysStartData = [...valleysStartData];
              let newValleysStartTimes = [...valleysStartTime];
              newValleysStartData.splice(selectedPoint.idx, 1);
              newValleysStartTimes.splice(selectedPoint.idx, 1);

              let newValleysEndData = [...valleysEndData];
              let newValleysEndTimes = [...valleysEndTimes];
              newValleysEndData.splice(selectedPoint.idx, 1);
              newValleysEndTimes.splice(selectedPoint.idx, 1);

              setPeaksData(newPeaksData);
              setPeaksTimes(newPeaksTimes);
              setValleysStartData(newValleysStartData);
              setValleysStartTime(newValleysStartTimes);
              setValleysEndData(newValleysEndData);
              setValleysEndTime(newValleysEndTimes);

              setShowAddButton(true);
              setAlertAgreed(false);
            }
            setSelectedPoint({});
            setIsMarkUp(false);
            resetBlurValues();
            setRevision(revision + 1);
          }
          break;
        case 'Escape':
          if (isMarkUp) {
            setSelectedPoint({});
            resetBlurValues();
            setIsMarkUp(false);
            setRevision(revision + 1);
          }
          if (!isMarkUp && addNewPoint) {
            // Cancel adding a brand-new cycle
            let newValleysStartData = [...valleysStartData];
            newValleysStartData.splice(valleysStartData.length - 1, 1);
            setValleysStartData(newValleysStartData);

            let newValleysStartTimes = [...valleysStartTime];
            newValleysStartTimes.splice(valleysStartTime.length - 1, 1);
            setValleysStartTime(newValleysStartTimes);

            if (addPointName === 'valley_end') {
              // Also remove peaks if the user cancels in the middle
              let newPeaksData = [...peaksData];
              newPeaksData.splice(peaksData.length - 1, 1);
              setPeaksData(newPeaksData);

              let newPeaksTimes = [...peaksTimes];
              newPeaksTimes.splice(peaksTimes.length - 1, 1);
              setPeaksTimes(newPeaksTimes);
            }
            setRevision(revision + 1);
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

  const handleClickonPlot = data => {
    videoRef.current.currentTime = data.points[0].x;
    videoRef.current.pause();

    // Add brand-new cycle points if in Add mode
    if (!isMarkUp && addNewPoint) {
      addNewPeakAndValley(data);
      return;
    }

    // Normal remove or select logic
    if (!isMarkUp) {
      const { name } = data.points[0].data;
      if (name === 'peak values') {
        if (
          peaksData.includes(data.points[0].y) &&
          peaksTimes.includes(data.points[0].x)
        ) {
          setSelectedPoint(
            handleSelectElementfromArray(
              peaksData,
              peaksTimes,
              data.points[0].x,
              name,
            ),
          );
        }
      } else if (name === 'valley start') {
        if (
          valleysStartData.includes(data.points[0].y) &&
          valleysStartTime.includes(data.points[0].x)
        ) {
          setSelectedPoint(
            handleSelectElementfromArray(
              valleysStartData,
              valleysStartTime,
              data.points[0].x,
              name,
            ),
          );
        }
      } else if (name === 'valley end') {
        if (
          valleysEndData.includes(data.points[0].y) &&
          valleysEndTimes.includes(data.points[0].x)
        ) {
          setSelectedPoint(
            handleSelectElementfromArray(
              valleysEndData,
              valleysEndTimes,
              data.points[0].x,
              name,
            ),
          );
        }
      }
      if (removeCycle) {
        setAlertPopupMsg(
          'All the points in the cycle will be removed. Click again to confirm.',
        );
        setShowAlertPopup(true);
      }
      setRevision(revision + 1);
    } else if (isAddNewPeakHigh) {
      // Quick add peak logic
      let newPeaksData = [...peaksData];
      let newPeaksTimes = [...peaksTimes];
      newPeaksData.push(data.points[0].y);
      newPeaksTimes.push(data.points[0].x);
      setPeaksData(newPeaksData);
      setPeaksTimes(newPeaksTimes);
      setRevision(revision + 1);
      updateRadarTable();
    } else if (isAddNewPeakLowStart) {
      let newValleysStartData = [...valleysStartData];
      let newValleysStartTimes = [...valleysStartTime];
      newValleysStartData.push(data.points[0].y);
      newValleysStartTimes.push(data.points[0].x);
      setValleysStartData(newValleysStartData);
      setValleysStartTime(newValleysStartTimes);
      setRevision(revision + 1);
      updateRadarTable();
    } else if (isAddNewPeakLowEnd) {
      let newValleysEndData = [...valleysEndData];
      let newValleysEndTimes = [...valleysEndTimes];
      newValleysEndData.push(data.points[0].y);
      newValleysEndTimes.push(data.points[0].x);
      setValleysEndData(newValleysEndData);
      setValleysEndTime(newValleysEndTimes);
      setRevision(revision + 1);
      updateRadarTable();
    } else if (isMarkUp) {
      // Move peak if user had previously selected a peak
      if (selectedPoint.name === 'peak values') {
        const idx = selectedPoint.idx;
        const newX = data.points[0].x;
        // Ensure new peak is within the current start/end
        if (
          newX > valleysStartTime[idx] &&
          newX < valleysEndTimes[idx]
        ) {
          let newPeaksData = [...peaksData];
          let newPeaksTime = [...peaksTimes];
          newPeaksData[idx] = data.points[0].y;
          newPeaksTime[idx] = newX;
          setPeaksData(newPeaksData);
          setPeaksTimes(newPeaksTime);
          setSelectedPoint({});
          resetBlurValues();
          setIsMarkUp(false);
          setRevision(revision + 1);
        } else {
          showPopUp('Peak must lie within the valley start/end range.');
        }
      }
    }
  };

  const addNewPeakAndValley = data => {
    // Standard 3-step cycle: valley_start -> peak -> valley_end
    const xVal = data.points[0].x;
    const yVal = data.points[0].y;

    if (addPointName === 'valley_start') {
      if (isBetweenValleys(xVal)) {
        showPopUp(
          'You are trying to place a valley start that overlaps another cycle. Choose a different point.',
        );
      } else {
        let newValleysStartData = [...valleysStartData];
        let newValleysStartTimes = [...valleysStartTime];
        newValleysStartData.push(yVal);
        newValleysStartTimes.push(xVal);
        setValleysStartData(newValleysStartData);
        setValleysStartTime(newValleysStartTimes);

        setAddPointName('peak');
        setBlurEnd(xVal);
        setBlurStart(getNextClosestPoint(xVal));
        showPopUp('Next, select the new peak point.');
      }
      setRevision(revision + 1);
    } else if (addPointName === 'peak') {
      if (validatePeak(xVal)) {
        let newPeaksData = [...peaksData];
        let newPeaksTimes = [...peaksTimes];
        newPeaksData.push(yVal);
        newPeaksTimes.push(xVal);
        setPeaksData(newPeaksData);
        setPeaksTimes(newPeaksTimes);

        setAddPointName('valley_end');
        setBlurEnd(xVal);
        setBlurStart(getNextClosestPoint(xVal));
        showPopUp('Finally, select the new valley end point.');
      } else {
        showPopUp('Peak is overlapping with an existing cycle range.');
      }
      setRevision(revision + 1);
    } else if (addPointName === 'valley_end') {
      if (validateValleyEnd(xVal)) {
        let newValleysEndData = [...valleysEndData];
        let newValleysEndTimes = [...valleysEndTimes];
        newValleysEndData.push(yVal);
        newValleysEndTimes.push(xVal);
        setValleysEndData(newValleysEndData);
        setValleysEndTime(newValleysEndTimes);

        closePopup();
        setAddNewPoint(false);
        setShowAddButton(true);
        resetBlurValues();
        setAddPointName('valley_start');
        updateRadarTable();
      } else {
        showPopUp('Valley end is overlapping with an existing cycle range.');
      }
      setRevision(revision + 1);
    }
  };

  const removePeakAndValley = () => {
    let newPeaksData = [...peaksData];
    let newPeaksTimes = [...peaksTimes];
    newPeaksData.splice(selectedPoint.idx, 1);
    newPeaksTimes.splice(selectedPoint.idx, 1);

    let newValleysStartData = [...valleysStartData];
    let newValleysStartTimes = [...valleysStartTime];
    newValleysStartData.splice(selectedPoint.idx, 1);
    newValleysStartTimes.splice(selectedPoint.idx, 1);

    let newValleysEndData = [...valleysEndData];
    let newValleysEndTimes = [...valleysEndTimes];
    newValleysEndData.splice(selectedPoint.idx, 1);
    newValleysEndTimes.splice(selectedPoint.idx, 1);

    setPeaksData(newPeaksData);
    setPeaksTimes(newPeaksTimes);
    setValleysStartData(newValleysStartData);
    setValleysStartTime(newValleysStartTimes);
    setValleysEndData(newValleysEndData);
    setValleysEndTime(newValleysEndTimes);

    setSelectedPoint({});
    resetBlurValues();
    setIsMarkUp(false);
    setRemoveCycle(false);
  };

  const showPopUp = msg => {
    setPopupMsg(msg);
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const resetBlurValues = () => {
    setBlurEnd(startTime);
    setBlurStart(endTime);
    closePopup();
  };

  const getNextClosestPoint = newX => {
    let min = endTime;
    for (let i = 0; i < valleysStartTime.length; i++) {
      if (valleysStartTime[i] > newX && valleysStartTime[i] < min) {
        min = valleysStartTime[i];
      }
    }
    return min;
  };

  const validatePeak = newX => {
    let newvalleyStart = valleysStartTime[valleysStartTime.length - 1];
    if (newX < newvalleyStart) return false;
    for (let i = 0; i < peaksTimes.length; i++) {
      if (
        (peaksTimes[i] >= newvalleyStart && peaksTimes[i] <= newX) ||
        (valleysStartTime[i] >= newvalleyStart &&
          valleysStartTime[i] <= newX) ||
        (valleysEndTimes[i] >= newvalleyStart &&
          valleysEndTimes[i] <= newX)
      ) {
        return false;
      }
    }
    return true;
  };

  const validateValleyEnd = newX => {
    let newPeak = peaksTimes[peaksTimes.length - 1];
    if (newX < newPeak) return false;
    for (let i = 0; i < valleysEndTimes.length; i++) {
      if (
        (peaksTimes[i] >= newPeak && peaksTimes[i] <= newX) ||
        (valleysStartTime[i] >= newPeak &&
          valleysStartTime[i] <= newX) ||
        (valleysEndTimes[i] >= newPeak && valleysEndTimes[i] <= newX)
      ) {
        return false;
      }
    }
    return true;
  };

  const isBetweenValleys = newX => {
    for (let i = 0; i < valleysStartTime.length; i++) {
      if (newX >= valleysStartTime[i] && newX <= valleysEndTimes[i]) {
        return true;
      }
    }
    return false;
  };

  const handleSelectElementfromArray = (
    arrayValues,
    arrayTimes,
    element,
    name,
  ) => {
    if (!isMarkUp) {
      setIsMarkUp(true);
      const idx = arrayTimes.indexOf(element);
      const peak_data = [arrayValues[idx]];
      const peak_time = [arrayTimes[idx]];

      if (name === 'peak values') {
        setBlurEnd(valleysStartTime[idx]);
        setBlurStart(valleysEndTimes[idx]);
      }
      return { peak_data, peak_time, idx, name };
    }
  };

  const updateRadarTable = async () => {
    try {
      let uploadData = new FormData();

      let jsonData = {
        peaks_Data: peaksData,
        peaks_Time: peaksTimes,
        valleys_StartData: valleysStartData,
        valleys_StartTime: valleysStartTime,
        valleys_EndData: valleysEndData,
        valleys_EndTime: valleysEndTimes,
        velocity_Data: velocityData,
        velocity_Time: velocityTime,
      };

      jsonData = JSON.stringify(jsonData);
      uploadData.append('json_data', jsonData);

      const response = await fetch('http://localhost:8000/api/update_plot/', {
        method: 'POST',
        body: uploadData,
      });
      if (response.ok) {
        const data = await response.json();
        let newJsonData = { ...taskRecord };
        newJsonData['radarTable'] = data;
        handleJSONUpload(true, newJsonData);
      } else {
        throw new Error('Server responded with an error!');
      }
    } catch (error) {
      console.error('Failed to update plot data:', error);
    }
  };

  const continueAlert = () => {
    setAlertAgreed(true);
    setShowAlertPopup(false);
    if (removeCycle) {
      removePeakAndValley();
    }
    resetBlurValues();
    setRevision(revision + 1);
    updateRadarTable();
  };

  // vertical line + blur shading
  const shapes = [
    {
      type: 'line',
      x0: videoCurrentTime,
      y0: 0,
      x1: videoCurrentTime,
      y1: 1,
      xref: 'x',
      yref: 'paper',
      line: {
        color: 'grey',
        width: 1,
      },
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
      {/* Wrapper to control max-width and center the Plot */}
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
                width: 5,
              },
            },
            {
              y: peaksData,
              x: peaksTimes,
              name: 'peak values',
              type: 'scatter',
              mode: 'markers',
              marker: {
                size: 10,
                color: '#41337A',
              },
            },
            {
              y: valleysStartData,
              x: valleysStartTime,
              name: 'valley start',
              type: 'scatter',
              mode: 'markers',
              marker: {
                size: 10,
                color: '#76B041',
              },
            },
            {
              y: valleysEndData,
              x: valleysEndTimes,
              name: 'valley end',
              type: 'scatter',
              mode: 'markers',
              marker: {
                size: 10,
                color: 'red',
              },
            },
            {
              y: selectedPoint.peak_data,
              x: selectedPoint.peak_time,
              name: 'Selected Point',
              type: 'scatter',
              mode: 'markers',
              marker: {
                size: 13,
                color: '#01FDF6',
              },
            },
          ]}
          revision={revision}
          onClick={data => handleClickonPlot(data)}
          config={{
            modeBarButtonsToRemove: [
              'zoom2d',
              'select2d',
              'lasso2d',
              'resetScale2d',
            ],
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

      {/* Button row - styled like header's Back button */}
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

      {/* Alert popup */}
      {showAlertPopup && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
          <div className="bg-white w-1/2 rounded-lg shadow-lg p-6">
            <span className="block mb-4">{alertPopupMsg}</span>
            <div className="flex justify-center gap-4">
              <Button
                variant="contained"
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
                onClick={() => setShowAlertPopup(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                sx={{
                  textTransform: 'none',
                  fontWeight: 'bold',
                }}
                onClick={continueAlert}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Informational popup (for "Add cycle" steps, etc.) */}
      {showPopup && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-300 hover:bg-gray-400 p-4 rounded-lg shadow-md w-3/4 max-w-xl">
          <span>{popupMsg}</span>
        </div>
      )}
    </div>
  );
};

export default WavePlotEditable;

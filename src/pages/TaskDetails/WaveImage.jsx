// src/pages/TaskDetails/WaveImage.jsx
import React, { useEffect, useState } from 'react';
import WavePlotEditable from './WavePlotEditable';

const WaveImage = ({
  selectedTaskIndex,
  tasks,
  setTasks,
  videoRef,
  startTime,
  endTime,
  handleJSONUpload,
}) => {
  return (
    <div>
      <div id="graph-container">
          <WavePlotEditable
            selectedTaskIndex={selectedTaskIndex}
            tasks={tasks}
            setTasks={setTasks}
            videoRef={videoRef}
            startTime={startTime}
            endTime={endTime}
            handleJSONUpload={handleJSONUpload}
          />
      </div>
    </div>
  );
};

export default WaveImage;

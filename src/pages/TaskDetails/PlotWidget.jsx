import { useEffect, useState } from 'react';
import ScatterPlot from './ScatterPlot';
import WavePlotEditable from './WavePlotEditable';


const PlotWidget = ({
  selectedTaskIndex,
  tasks,
  setTasks,
  fileName,
  videoRef,
  startTime,
  endTime,
  handleJSONUpload,
}) => {
  return (
    <div className="flex flex-col overflow-auto">
      <div className="pt-2 border-b border-gray-300">
        {tasks[selectedTaskIndex].data?.linePlot ? (
          <WavePlotEditable
            selectedTaskIndex={selectedTaskIndex}
            tasks={tasks}
            setTasks={setTasks}
            videoRef={videoRef}
            startTime={startTime}
            endTime={endTime}
            handleJSONUpload={handleJSONUpload}
          />
        ) : null}
      </div>

      <div className="pt-6">
        {tasks[selectedTaskIndex].data?.radar ? (
          <ScatterPlot
            selectedTaskIndex={selectedTaskIndex}
            tasks={tasks}
            fileName={fileName}
          />
        ) : null}
      </div>
    </div>
  );
};

export default PlotWidget;
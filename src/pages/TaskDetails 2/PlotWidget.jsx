import WaveImage from './WaveImage';
import ScatterPlot from './ScatterPlot';

const PlotWidget = props => {
  return (
    <div className="overflow-scroll">
      <div className="pt-2 border-b border-gray-300">
        {props.taskRecord.linePlot != null && (
          <WaveImage
            taskRecord={props.taskRecord}
            videoRef={props.videoRef}
            startTime={props.startTime}
            endTime={props.endTime}
            handleJSONUpload={props.handleJSONUpload}
          />
        )}
      </div>

      <div className="pt-6">
        {props.taskRecord.radar != null && (
          <ScatterPlot
            taskRecord={props.taskRecord}
            taskName={props.taskName}
          />
        )}
      </div>
    </div>
  );
};

export default PlotWidget;

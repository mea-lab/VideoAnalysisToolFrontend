// src/components/commons/VideoPlayer/BoundingBoxesOverlay.jsx
import React, { useRef } from 'react';

const BoundingBoxesOverlay = ({
  boundingBoxes,
  setBoundingBoxes,
  taskBoxes,
  setTaskBoxes,
  currentFrame,
  persons,
  zoomLevel,
  panOffset,
  videoWidth,
  videoHeight,
  screen,
  selectedTask,
  landMarks,
  fps,
}) => {
  const svgRef = useRef(null);
  const resizingBoxRef = useRef(null);
  const draggingBoxRef = useRef(null);
  const resizingTaskRef = useRef(null);
  const draggingTaskRef = useRef(null);

  const getSVGPoint = (evt) => {
    const svg = svgRef.current;
    if (!svg) return { x: evt.clientX, y: evt.clientY };
    const point = svg.createSVGPoint();
    point.x = evt.clientX;
    point.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      return point.matrixTransform(ctm.inverse());
    }
    return { x: evt.clientX, y: evt.clientY };
  };

  const handleBoxHover = (boxId) => {
  };

  const handleBoxClick = (boxId) => {
  };

  const handleResizeStart = (e, box, personIndex, side) => {
    e.stopPropagation();
    e.preventDefault();
    const { x: startX, y: startY } = getSVGPoint(e);
    const boxData = box.data[personIndex];
    resizingBoxRef.current = {
      frameNumber: box.frameNumber,
      personIndex,
      id: boxData.id,
      startX,
      startY,
      initialX: boxData.x ?? 10,
      initialY: boxData.y ?? 10,
      initialWidth: boxData.width ?? 200,
      initialHeight: boxData.height ?? 200,
      side,
    };
    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeEnd);
  };

  const handleResizeMove = (e) => {
    if (!resizingBoxRef.current) return;
    const { x, y } = getSVGPoint(e);
    const { startX, startY, initialX, initialY, initialWidth, initialHeight, side } =
      resizingBoxRef.current;
    let newX = initialX;
    let newY = initialY;
    let newWidth = initialWidth;
    let newHeight = initialHeight;
    const minSize = 10;
    const deltaX = x - startX;
    const deltaY = y - startY;
    if (side === 'top') {
      newHeight = Math.max(minSize, initialHeight - deltaY);
      newY = initialY + (initialHeight - newHeight);
    } else if (side === 'bottom') {
      newHeight = Math.max(minSize, initialHeight + deltaY);
    } else if (side === 'left') {
      newWidth = Math.max(minSize, initialWidth - deltaX);
      newX = initialX + (initialWidth - newWidth);
    } else if (side === 'right') {
      newWidth = Math.max(minSize, initialWidth + deltaX);
    }
    setBoundingBoxes((prevBoxes) =>
      prevBoxes.map((b) =>
        b.frameNumber === resizingBoxRef.current.frameNumber
          ? {
              ...b,
              data: b.data.map((personBox, idx) =>
                idx === resizingBoxRef.current.personIndex
                  ? { ...personBox, x: newX, y: newY, width: newWidth, height: newHeight }
                  : personBox
              ),
            }
          : b
      )
    );
  };

  const handleResizeEnd = () => {
    resizingBoxRef.current = null;
    window.removeEventListener('pointermove', handleResizeMove);
    window.removeEventListener('pointerup', handleResizeEnd);
  };

  const handleBoxDragStart = (e, box, personIndex) => {
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = getSVGPoint(e);
    const boxData = box.data[personIndex];
    draggingBoxRef.current = {
      frameNumber: box.frameNumber,
      personIndex,
      id: boxData.id,
      startX: x,
      startY: y,
      initialX: boxData.x ?? 10,
      initialY: boxData.y ?? 10,
    };
    window.addEventListener('pointermove', handleBoxDragMove);
    window.addEventListener('pointerup', handleBoxDragEnd);
  };

  const handleBoxDragMove = (e) => {
    if (!draggingBoxRef.current) return;
    const { x, y } = getSVGPoint(e);
    const { startX, startY, initialX, initialY, personIndex, frameNumber } =
      draggingBoxRef.current;
    const dx = x - startX;
    const dy = y - startY;
    const newX = initialX + dx;
    const newY = initialY + dy;
    setBoundingBoxes((prevBoxes) =>
      prevBoxes.map((b) =>
        b.frameNumber === draggingBoxRef.current.frameNumber
          ? {
              ...b,
              data: b.data.map((personBox, idx) =>
                idx === draggingBoxRef.current.personIndex
                  ? { ...personBox, x: newX, y: newY }
                  : personBox
              ),
            }
          : b
      )
    );
  };

  const handleBoxDragEnd = () => {
    draggingBoxRef.current = null;
    window.removeEventListener('pointermove', handleBoxDragMove);
    window.removeEventListener('pointerup', handleBoxDragEnd);
  };

  const handleTaskResizeStart = (e, task, taskIndex, side) => {
    e.stopPropagation();
    e.preventDefault();
    const { x: startX, y: startY } = getSVGPoint(e);
    resizingTaskRef.current = {
      taskIndex,
      startX,
      startY,
      initialX: task.x,
      initialY: task.y,
      initialWidth: task.width,
      initialHeight: task.height,
      side,
    };
    window.addEventListener('pointermove', handleTaskResizeMove);
    window.addEventListener('pointerup', handleTaskResizeEnd);
  };

  const handleTaskResizeMove = (e) => {
    if (!resizingTaskRef.current) return;
    const { x, y } = getSVGPoint(e);
    const { startX, startY, initialX, initialY, initialWidth, initialHeight, side, taskIndex } =
      resizingTaskRef.current;
    let newX = initialX;
    let newY = initialY;
    let newWidth = initialWidth;
    let newHeight = initialHeight;
    const minSize = 10;
    const deltaX = x - startX;
    const deltaY = y - startY;
    if (side === 'top') {
      newHeight = Math.max(minSize, initialHeight - deltaY);
      newY = initialY + (initialHeight - newHeight);
    } else if (side === 'bottom') {
      newHeight = Math.max(minSize, initialHeight + deltaY);
    } else if (side === 'left') {
      newWidth = Math.max(minSize, initialWidth - deltaX);
      newX = initialX + (initialWidth - newWidth);
    } else if (side === 'right') {
      newWidth = Math.max(minSize, initialWidth + deltaX);
    }
    setTaskBoxes((prevBoxes) =>
      prevBoxes.map((task, idx) =>
        idx === taskIndex ? { ...task, x: newX, y: newY, width: newWidth, height: newHeight } : task
      )
    );
  };

  const handleTaskResizeEnd = () => {
    resizingTaskRef.current = null;
    window.removeEventListener('pointermove', handleTaskResizeMove);
    window.removeEventListener('pointerup', handleTaskResizeEnd);
  };

  const handleTaskDragStart = (e, task, taskIndex) => {
    e.stopPropagation();
    e.preventDefault();
    const { x, y } = getSVGPoint(e);
    draggingTaskRef.current = {
      taskIndex,
      startX: x,
      startY: y,
      initialX: task.x,
      initialY: task.y,
    };
    window.addEventListener('pointermove', handleTaskDragMove);
    window.addEventListener('pointerup', handleTaskDragEnd);
  };

  const handleTaskDragMove = (e) => {
    if (!draggingTaskRef.current) return;
    const { x, y } = getSVGPoint(e);
    const { startX, startY, initialX, initialY, taskIndex } = draggingTaskRef.current;
    const dx = x - startX;
    const dy = y - startY;
    const newX = initialX + dx;
    const newY = initialY + dy;
    setTaskBoxes((prevBoxes) =>
      prevBoxes.map((task, idx) =>
        idx === taskIndex ? { ...task, x: newX, y: newY } : task
      )
    );
  };

  const handleTaskDragEnd = () => {
    draggingTaskRef.current = null;
    window.removeEventListener('pointermove', handleTaskDragMove);
    window.removeEventListener('pointerup', handleTaskDragEnd);
  };


  let taskToRender = null;
  let taskIndex = -1;
  if (screen === 'tasks') {
    const currentTime = currentFrame / fps;
    taskIndex = taskBoxes.findIndex((t) => currentTime >= t.start && currentTime <= t.end);
    if (taskIndex !== -1) {
      taskToRender = taskBoxes[taskIndex];
    }
  } else if (screen === 'taskDetails') {
    if (selectedTask != null && taskBoxes[selectedTask]) {
      taskIndex = selectedTask;
      taskToRender = taskBoxes[selectedTask];
    }
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${videoWidth} ${videoHeight}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
        transformOrigin: 'center center',
        pointerEvents: 'all',
      }}
    >
      {/* If in tasks or taskDetails screen, draw the task box (with modification handlers) */}
      {(screen === 'tasks' || screen === 'taskDetails') && taskToRender ? (
        <g key={`task-${taskIndex}`}>
          <rect
            x={taskToRender.x}
            y={taskToRender.y}
            width={taskToRender.width}
            height={taskToRender.height}
            stroke="green"
            strokeWidth={8}
            fill="none"
            pointerEvents="stroke"
            onPointerDown={(e) => handleTaskDragStart(e, taskToRender, taskIndex)}
            style={{ cursor: 'move' }}
          />
          {/* Top handle */}
          <rect
            x={taskToRender.x + (taskToRender.width - taskToRender.width / 4) / 2}
            y={taskToRender.y - 12.5 / 2}
            width={taskToRender.width / 4}
            height={12.5}
            fill="#4A8074"
            stroke="white"
            strokeWidth="2"
            onPointerDown={(e) => handleTaskResizeStart(e, taskToRender, taskIndex, 'top')}
            style={{ cursor: 'ns-resize' }}
          />
          {/* Bottom handle */}
          <rect
            x={taskToRender.x + (taskToRender.width - taskToRender.width / 4) / 2}
            y={taskToRender.y + taskToRender.height - 12.5 / 2}
            width={taskToRender.width / 4}
            height={12.5}
            fill="#4A8074"
            stroke="white"
            strokeWidth="2"
            onPointerDown={(e) => handleTaskResizeStart(e, taskToRender, taskIndex, 'bottom')}
            style={{ cursor: 'ns-resize' }}
          />
          {/* Left handle */}
          <rect
            x={taskToRender.x - 12.5 / 2}
            y={taskToRender.y + (taskToRender.height - taskToRender.height / 4) / 2}
            width={12.5}
            height={taskToRender.height / 4}
            fill="#4A8074"
            stroke="white"
            strokeWidth="2"
            onPointerDown={(e) => handleTaskResizeStart(e, taskToRender, taskIndex, 'left')}
            style={{ cursor: 'ew-resize' }}
          />
          {/* Right handle */}
          <rect
            x={taskToRender.x + taskToRender.width - 12.5 / 2}
            y={taskToRender.y + (taskToRender.height - taskToRender.height / 4) / 2}
            width={12.5}
            height={taskToRender.height / 4}
            fill="#4A8074"
            stroke="white"
            strokeWidth="2"
            onPointerDown={(e) => handleTaskResizeStart(e, taskToRender, taskIndex, 'right')}
            style={{ cursor: 'ew-resize' }}
          />
          {/* If screen is taskDetails, also render landmarks */}
          {screen === 'taskDetails' &&
            (() => {
              if (!taskToRender) return null;
              const offset = Math.round(taskToRender.start * fps);
              const frameIndex = currentFrame - offset;
              const landmark = landMarks && landMarks[frameIndex];
              if (!landmark) return null;
              // Optionally enlarge the task box (similar to useCanvasDrawer)
              const enlargedTask = {
                ...taskToRender,
                x: Math.max(0, taskToRender.x - taskToRender.width * 0.125),
                y: Math.max(0, taskToRender.y - taskToRender.height * 0.125),
              };
              if (Array.isArray(landmark) && landmark.length >= 2) {
                if (Array.isArray(landmark[0])) {
                  // Multiple landmark points
                  return landmark.map(([lx, ly], idx) => (
                    <circle
                      key={`landmark-${idx}`}
                      cx={lx + enlargedTask.x}
                      cy={ly + enlargedTask.y}
                      r={10}
                      fill="red"
                    />
                  ));
                } else {
                  // Single landmark point
                  return (
                    <rect
                      x={landmark[0] + enlargedTask.x - 15}
                      y={landmark[1] + enlargedTask.y - 15}
                      width={30}
                      height={30}
                      fill="red"
                    />
                  );
                }
              }
              return null;
            })()}
        </g>
      ) : (
        // Otherwise, render the original bounding boxes (filtered by currentFrame)
        boundingBoxes
          .filter((box) => box.frameNumber === currentFrame)
          .map((box) =>
            box.data.map((boxData, index) => {
              const x = boxData.x ?? 10;
              const y = boxData.y ?? 10;
              const width = boxData.width ?? 200;
              const height = boxData.height ?? 200;
              const strokeThickness = 12.5;
              const strokeColor = persons.find((p) => p.id === boxData.id && p.isSubject)
                ? 'green'
                : 'red';
              return (
                <g key={`${boxData.id}-${box.frameNumber}-${index}`}>
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    stroke={strokeColor}
                    strokeWidth={strokeThickness}
                    fill="none"
                    pointerEvents="stroke"
                    onMouseEnter={() => handleBoxHover(boxData.id)}
                    onMouseLeave={() => {}}
                    onClick={() => handleBoxClick(boxData.id)}
                    onPointerDown={(e) => {
                      if (screen === 'tasks') {
                        handleBoxDragStart(e, box, index);
                      }
                    }}
                    style={{ cursor: screen === 'tasks' ? 'move' : 'default' }}
                  />
                  {screen === 'tasks' && (
                    <>
                      <rect
                        x={x + (width - width / 4) / 2}
                        y={y - strokeThickness / 2}
                        width={width / 4}
                        height={strokeThickness}
                        fill="#4A8074"
                        stroke="white"
                        strokeWidth="2"
                        onPointerDown={(e) => handleResizeStart(e, box, index, 'top')}
                        style={{ cursor: 'ns-resize' }}
                      />
                      <rect
                        x={x + (width - width / 4) / 2}
                        y={y + height - strokeThickness / 2}
                        width={width / 4}
                        height={strokeThickness}
                        fill="#4A8074"
                        stroke="white"
                        strokeWidth="2"
                        onPointerDown={(e) => handleResizeStart(e, box, index, 'bottom')}
                        style={{ cursor: 'ns-resize' }}
                      />
                      <rect
                        x={x - strokeThickness / 2}
                        y={y + (height - height / 4) / 2}
                        width={strokeThickness}
                        height={height / 4}
                        fill="#4A8074"
                        stroke="white"
                        strokeWidth="2"
                        onPointerDown={(e) => handleResizeStart(e, box, index, 'left')}
                        style={{ cursor: 'ew-resize' }}
                      />
                      <rect
                        x={x + width - strokeThickness / 2}
                        y={y + (height - height / 4) / 2}
                        width={strokeThickness}
                        height={height / 4}
                        fill="#4A8074"
                        stroke="white"
                        strokeWidth="2"
                        onPointerDown={(e) => handleResizeStart(e, box, index, 'right')}
                        style={{ cursor: 'ew-resize' }}
                      />
                    </>
                  )}
                </g>
              );
            })
          )
      )}
    </svg>
  );
};

export default BoundingBoxesOverlay;

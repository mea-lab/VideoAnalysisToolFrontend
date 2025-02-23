// src/components/commons/VideoPlayer/BoundingBoxesOverlay.jsx
import React, { useRef, useEffect } from 'react';

const ResizeHandles = ({ x, y, width, height, onResize, item, index, handleSize = 12.5 }) => {
  const handles = [
    {
      side: 'top',
      x: x + (width - width / 4) / 2,
      y: y - handleSize / 2,
      width: width / 4,
      height: handleSize,
      cursor: 'ns-resize'
    },
    {
      side: 'bottom',
      x: x + (width - width / 4) / 2,
      y: y + height - handleSize / 2,
      width: width / 4,
      height: handleSize,
      cursor: 'ns-resize'
    },
    {
      side: 'left',
      x: x - handleSize / 2,
      y: y + (height - height / 4) / 2,
      width: handleSize,
      height: height / 4,
      cursor: 'ew-resize'
    },
    {
      side: 'right',
      x: x + width - handleSize / 2,
      y: y + (height - height / 4) / 2,
      width: handleSize,
      height: height / 4,
      cursor: 'ew-resize'
    }
  ];

  return handles.map(handle => (
    <rect
      key={handle.side}
      x={handle.x}
      y={handle.y}
      width={handle.width}
      height={handle.height}
      fill="#4A8074"
      stroke="white"
      strokeWidth="2"
      onPointerDown={(e) => onResize(e, item, index, handle.side)}
      style={{ cursor: handle.cursor }}
    />
  ));
};

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
  videoRef,
}) => {
  // Only render overlays when the video is paused.
  // if (videoRef && videoRef.current && !videoRef.current.paused) {
  //   return null;
  // }

  const svgRef = useRef(null);
  const resizingTaskRef = useRef(null);
  const draggingTaskRef = useRef(null);
  const initialTaskBoxRef = useRef(null);

  // Convert pointer events to SVG coordinates.
  const getSVGPoint = (evt) => {
    const svg = svgRef.current;
    if (!svg) return { x: evt.clientX, y: evt.clientY };
    const point = svg.createSVGPoint();
    point.x = evt.clientX;
    point.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    return ctm ? point.matrixTransform(ctm.inverse()) : { x: evt.clientX, y: evt.clientY };
  };

  // (Empty functions for hover/click – implement as needed)
  const handleBoxHover = (boxId) => {};
  const handleBoxClick = (boxId) => {};

  // === Task box resizing and dragging (for the task detail view) ===
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
    const { startX, startY, initialX, initialY } = draggingTaskRef.current;
    const dx = x - startX;
    const dy = y - startY;
    const newX = initialX + dx;
    const newY = initialY + dy;
    setTaskBoxes((prevBoxes) =>
      prevBoxes.map((task, idx) =>
        idx === draggingTaskRef.current.taskIndex ? { ...task, x: newX, y: newY } : task
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

  useEffect(() => {
    if (screen === 'taskDetails' && selectedTask != null && taskBoxes[selectedTask] && !initialTaskBoxRef.current) {
      initialTaskBoxRef.current = taskBoxes[selectedTask];
    }
  }, [screen, selectedTask, taskBoxes]);

  const strokeThickness = 10;
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
      {(screen === 'tasks' || screen === 'taskDetails') && taskToRender ? (
        <g key={`task-${taskIndex}`}>
          <rect
            x={taskToRender.x}
            y={taskToRender.y}
            width={taskToRender.width}
            height={taskToRender.height}
            stroke="green"
            strokeWidth={strokeThickness}
            fill="none"
            pointerEvents="stroke"
            onPointerDown={(e) => handleTaskDragStart(e, taskToRender, taskIndex)}
            style={{ cursor: 'move' }}
          />
          <ResizeHandles
            x={taskToRender.x}
            y={taskToRender.y}
            width={taskToRender.width}
            height={taskToRender.height}
            handleSize={strokeThickness}
            onResize={handleTaskResizeStart}
            item={taskToRender}
            index={taskIndex}
          />
        </g>
      ) : (
        // Render all bounding boxes
        boundingBoxes
          .filter((box) => box.frameNumber === currentFrame)
          .map((box) =>
            box.data.map((boxData, index) => {
              const x = boxData.x ?? 10;
              const y = boxData.y ?? 10;
              const width = boxData.width ?? 200;
              const height = boxData.height ?? 200;
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
                    onClick={() => handleBoxClick(boxData.id)}
                  />
                </g>
              );
            })
          )
      )}
    </svg>
  );
};

export default BoundingBoxesOverlay;

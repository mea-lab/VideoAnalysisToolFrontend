// src/components/commons/VideoPlayer/BoundingBoxesOverlay.jsx
import React, { useRef } from 'react';

const BoundingBoxesOverlay = ({
  boxes,
  currentFrame,
  persons,
  zoomLevel,
  panOffset,
  setBoundingBoxes,
  videoWidth,
  videoHeight,
}) => {
  console.log("boxes", boxes);
  const svgRef = useRef(null);
  const resizingBoxRef = useRef(null);
  const draggingBoxRef = useRef(null);

  // Convert pointer (client) coordinates into SVG coordinates (video pixel coordinates)
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

  // Handle when the pointer enters or leaves a box.
  const handleBoxHover = (boxId) => {
    console.log("Hovering over box", boxId);
  };

  const handleBoxClick = (boxId) => {
    console.log(`Box clicked: ${boxId}`);
  };

  // --- Resizing Logic ---
  // Now we pass in personIndex so we know which item inside box.data to update.
  const handleResizeStart = (e, box, personIndex, side) => {
    e.stopPropagation();
    e.preventDefault();
    // Convert pointer coordinates to SVG (video pixel) coordinates.
    const { x: startX, y: startY } = getSVGPoint(e);
    const boxData = box.data[personIndex]; // now use the specific person’s box data.
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
    const { startX, startY, initialX, initialY, initialWidth, initialHeight, side } = resizingBoxRef.current;
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

  // --- Dragging Logic ---
  // Now pass in personIndex so we know which person’s box is being dragged.
  const handleBoxDragStart = (e, box, personIndex) => {
    // Only allow dragging when the user clicks on the border (not the interior)
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
    const { startX, startY, initialX, initialY } = draggingBoxRef.current;
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
      {boxes
        .filter((box) => box.frameNumber === currentFrame)
        .map((box) =>
          box.data.map((boxData, index) => {
            const x = boxData.x ?? 10;
            const y = boxData.y ?? 10;
            const width = boxData.width ?? 200;
            const height = boxData.height ?? 200;
            const strokeThickness = 12.5;
            const strokeColor = persons.find((p) => p.id === boxData.id && p.isSubject) ? 'green' : 'red';

            return (
              <g key={`${boxData.id}-${box.frameNumber}-${index}`}>
                {/* Main bounding box (only the stroke is interactable) */}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  stroke={strokeColor}
                  strokeWidth={strokeThickness}
                  fill="none"
                  pointerEvents="stroke" // only the border (stroke) captures events
                  onMouseEnter={() => handleBoxHover(boxData.id)}
                  onMouseLeave={() => {}}
                  onClick={() => handleBoxClick(boxData.id)}
                  onPointerDown={(e) => handleBoxDragStart(e, box, index)}
                  style={{ cursor: 'move' }}
                />
                {/* Top handle: wide rectangle along the top */}
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
                {/* Bottom handle: wide rectangle along the bottom */}
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
                {/* Left handle: tall rectangle along the left */}
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
                {/* Right handle: tall rectangle along the right */}
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
              </g>
            );
          })
        )}
    </svg>
  );
};

export default BoundingBoxesOverlay;

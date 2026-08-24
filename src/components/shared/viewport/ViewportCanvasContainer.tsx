import React, { ReactNode } from 'react';
import { useMasonViewport, UseMasonViewportReturn } from './useMasonViewport';
import { ViewportHUD, ViewportHUDProps } from './ViewportHUD';

export interface ViewportCanvasContainerProps {
  viewport: UseMasonViewportReturn;
  children: ReactNode;
  hudProps?: Partial<ViewportHUDProps>;
  showHud?: boolean;
  className?: string;
  cursorMode?: 'default' | 'crosshair' | 'grab' | 'pointer';
}

export const ViewportCanvasContainer: React.FC<ViewportCanvasContainerProps> = ({
  viewport,
  children,
  hudProps,
  showHud = true,
  className = '',
  cursorMode = 'default'
}) => {
  const {
    scale,
    isPanning,
    isSpaceDown,
    containerRef,
    handleMouseDown,
    handleContextMenu,
    zoomIn,
    zoomOut,
    centerContent,
    fitContent,
    resetView
  } = viewport;

  const getCursorClass = () => {
    if (isPanning) return 'cursor-grabbing';
    if (isSpaceDown) return 'cursor-grab';
    if (cursorMode === 'crosshair') return 'cursor-crosshair';
    if (cursorMode === 'grab') return 'cursor-grab';
    if (cursorMode === 'pointer') return 'cursor-pointer';
    return 'cursor-default';
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
      className={`relative w-full h-full overflow-hidden bg-neutral-950 select-none ${getCursorClass()} ${className}`}
    >
      {children}

      {showHud && (
        <ViewportHUD
          scale={scale}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={() => resetView()}
          onCenterContent={() => centerContent(800, 600, 1.0)}
          onFitContent={() => fitContent(800, 600, 48)}
          {...hudProps}
        />
      )}
    </div>
  );
};

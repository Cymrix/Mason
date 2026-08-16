import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface PanZoomOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  initialPan?: { x: number; y: number };
  zoomSensitivity?: number;
}

export function useCanvasPanZoom(options: PanZoomOptions = {}) {
  const {
    minScale = 0.2,
    maxScale = 6.0,
    initialScale = 1.0,
    initialPan = { x: 0, y: 0 },
    zoomSensitivity = 1.15
  } = options;

  const [scale, setScale] = useState<number>(initialScale);
  const [pan, setPan] = useState<{ x: number; y: number }>(initialPan);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);

  // Callback ref that updates containerNode state so useEffect re-binds wheel events when container mounts or switches
  const setRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    setContainerNode(node);
  }, []);

  // Backwards compatibility getter/setter for containerRef.current
  const combinedRef = React.useMemo(() => {
    const fn = (node: HTMLDivElement | null) => setRef(node);
    Object.defineProperty(fn, 'current', {
      get() { return containerRef.current; },
      set(val: HTMLDivElement | null) { setRef(val); },
      configurable: true
    });
    return fn as unknown as React.RefObject<HTMLDivElement>;
  }, [setRef]);

  const isDraggingRef = useRef<boolean>(false);
  const startMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle non-passive wheel event to zoom centered on mouse cursor
  useEffect(() => {
    if (!containerNode) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = containerNode.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const factor = e.deltaY < 0 ? zoomSensitivity : 1 / zoomSensitivity;

      setScale((prevScale) => {
        const newScale = Math.min(Math.max(prevScale * factor, minScale), maxScale);
        if (Math.abs(newScale - prevScale) < 0.0001) return prevScale;

        setPan((prevPan) => {
          // World point before zoom
          const worldX = (mouseX - prevPan.x) / prevScale;
          const worldY = (mouseY - prevPan.y) / prevScale;
          // New pan to keep world point fixed under cursor
          const newPanX = mouseX - worldX * newScale;
          const newPanY = mouseY - worldY * newScale;
          return { x: newPanX, y: newPanY };
        });

        return newScale;
      });
    };

    containerNode.addEventListener('wheel', handleWheel, { passive: false });
    return () => containerNode.removeEventListener('wheel', handleWheel);
  }, [containerNode, minScale, maxScale, zoomSensitivity]);

  // Window mouse move & up listeners for smooth right-click panning even if cursor leaves container
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - startMouseRef.current.x;
      const dy = e.clientY - startMouseRef.current.y;
      setPan({
        x: startPanRef.current.x + dx,
        y: startPanRef.current.y + dy
      });
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2 || isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsPanning(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handlers to attach to container
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      // Right click pan
      e.preventDefault();
      e.stopPropagation();
      isDraggingRef.current = true;
      setIsPanning(true);
      startMouseRef.current = { x: e.clientX, y: e.clientY };
      startPanRef.current = { ...pan };
    }
  }, [pan]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const resetView = useCallback((canvasWidth?: number, canvasHeight?: number) => {
    setScale(initialScale);
    if (containerRef.current && canvasWidth && canvasHeight) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const centerX = (containerRect.width - canvasWidth * initialScale) / 2;
      const centerY = (containerRect.height - canvasHeight * initialScale) / 2;
      setPan({ x: centerX, y: centerY });
    } else {
      setPan(initialPan);
    }
  }, [initialScale, initialPan]);

  const centerContent = useCallback((canvasWidth: number, canvasHeight: number, targetScale = 1.0) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = (containerRect.width - canvasWidth * targetScale) / 2;
    const centerY = (containerRect.height - canvasHeight * targetScale) / 2;
    setScale(targetScale);
    setPan({ x: centerX, y: centerY });
  }, []);

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    const mouseX = container ? container.clientWidth / 2 : 0;
    const mouseY = container ? container.clientHeight / 2 : 0;

    setScale(prevScale => {
      const newScale = Math.min(prevScale * zoomSensitivity, maxScale);
      setPan(prevPan => {
        const worldX = (mouseX - prevPan.x) / prevScale;
        const worldY = (mouseY - prevPan.y) / prevScale;
        return {
          x: mouseX - worldX * newScale,
          y: mouseY - worldY * newScale
        };
      });
      return newScale;
    });
  }, [zoomSensitivity, maxScale]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    const mouseX = container ? container.clientWidth / 2 : 0;
    const mouseY = container ? container.clientHeight / 2 : 0;

    setScale(prevScale => {
      const newScale = Math.max(prevScale / zoomSensitivity, minScale);
      setPan(prevPan => {
        const worldX = (mouseX - prevPan.x) / prevScale;
        const worldY = (mouseY - prevPan.y) / prevScale;
        return {
          x: mouseX - worldX * newScale,
          y: mouseY - worldY * newScale
        };
      });
      return newScale;
    });
  }, [zoomSensitivity, minScale]);

  return {
    scale,
    pan,
    isPanning,
    containerRef: combinedRef,
    handleMouseDown,
    handleContextMenu,
    resetView,
    centerContent,
    zoomIn,
    zoomOut,
    setScale,
    setPan
  };
}

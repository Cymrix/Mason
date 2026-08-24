import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';

export interface MasonViewportOptions {
  minScale?: number;
  maxScale?: number;
  initialScale?: number;
  initialPan?: { x: number; y: number };
  zoomSensitivity?: number;
  gridSize?: number;
  originMode?: 'topleft' | 'center';
}

export interface WorldPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export function useMasonViewport(options: MasonViewportOptions = {}) {
  const {
    minScale = 0.15,
    maxScale = 6.0,
    initialScale = 1.0,
    initialPan = { x: 0, y: 0 },
    zoomSensitivity = 1.15,
    gridSize = 16,
    originMode = 'center'
  } = options;

  const [scale, setScaleState] = useState<number>(initialScale);
  const [pan, setPanState] = useState<WorldPoint>(initialPan);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpaceDown, setIsSpaceDown] = useState<boolean>(false);

  const scaleRef = useRef(initialScale);
  const panRef = useRef(initialPan);
  const isSpaceDownRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const startMouseRef = useRef<ScreenPoint>({ x: 0, y: 0 });
  const startPanRef = useRef<WorldPoint>({ x: 0, y: 0 });

  // Touch gesture support
  const touchStartDistRef = useRef<number | null>(null);
  const touchStartScaleRef = useRef<number>(initialScale);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  const setScale = useCallback((updater: number | ((s: number) => number)) => {
    setScaleState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const clamped = Math.min(Math.max(next, minScale), maxScale);
      scaleRef.current = clamped;
      return clamped;
    });
  }, [minScale, maxScale]);

  const setPan = useCallback((updater: WorldPoint | ((p: WorldPoint) => WorldPoint)) => {
    setPanState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      panRef.current = next;
      return next;
    });
  }, []);

  // Callback ref that updates containerNode state
  const setRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    setContainerNode(node);
  }, []);

  const combinedRef = useMemo(() => {
    const fn = (node: HTMLDivElement | null) => setRef(node);
    Object.defineProperty(fn, 'current', {
      get() { return containerRef.current; },
      set(val: HTMLDivElement | null) { setRef(val); },
      configurable: true
    });
    return fn as unknown as React.RefObject<HTMLDivElement>;
  }, [setRef]);

  // Track container dimensions via ResizeObserver
  useEffect(() => {
    if (!containerNode) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setViewportSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });
    ro.observe(containerNode);
    return () => ro.disconnect();
  }, [containerNode]);

  // Global Spacebar Key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        isSpaceDownRef.current = true;
        setIsSpaceDown(true);
        (window as any).__isSpaceDown = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDownRef.current = false;
        setIsSpaceDown(false);
        (window as any).__isSpaceDown = false;
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          setIsPanning(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Coordinate conversion: Screen (mouse in container) -> World
  const screenToWorld = useCallback((screenPt: ScreenPoint, customOriginMode?: 'topleft' | 'center'): WorldPoint => {
    const s = scaleRef.current;
    const p = panRef.current;
    const mode = customOriginMode || originMode;
    if (mode === 'center' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      return {
        x: (screenPt.x - (centerX + p.x)) / s,
        y: (screenPt.y - (centerY + p.y)) / s
      };
    }
    return {
      x: (screenPt.x - p.x) / s,
      y: (screenPt.y - p.y) / s
    };
  }, [originMode]);

  // Coordinate conversion: World -> Screen (in container)
  const worldToScreen = useCallback((worldPt: WorldPoint, customOriginMode?: 'topleft' | 'center'): ScreenPoint => {
    const s = scaleRef.current;
    const p = panRef.current;
    const mode = customOriginMode || originMode;
    if (mode === 'center' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      return {
        x: centerX + p.x + worldPt.x * s,
        y: centerY + p.y + worldPt.y * s
      };
    }
    return {
      x: p.x + worldPt.x * s,
      y: p.y + worldPt.y * s
    };
  }, [originMode]);

  // Grid snapping helper
  const snapToGrid = useCallback((worldPt: WorldPoint, customGridSize?: number): WorldPoint => {
    const g = customGridSize || gridSize;
    return {
      x: Math.round(worldPt.x / g) * g,
      y: Math.round(worldPt.y / g) * g
    };
  }, [gridSize]);

  // Non-passive wheel event for smooth cursor-anchored zoom
  useEffect(() => {
    if (!containerNode) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = containerNode.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? zoomSensitivity : 1 / zoomSensitivity;

      const prevScale = scaleRef.current;
      const prevPan = panRef.current;

      const newScale = Math.min(Math.max(prevScale * factor, minScale), maxScale);
      if (Math.abs(newScale - prevScale) < 0.0001) return;

      let worldX: number;
      let worldY: number;
      let newPanX: number;
      let newPanY: number;

      if (originMode === 'center') {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        worldX = (mouseX - (centerX + prevPan.x)) / prevScale;
        worldY = (mouseY - (centerY + prevPan.y)) / prevScale;

        newPanX = mouseX - centerX - worldX * newScale;
        newPanY = mouseY - centerY - worldY * newScale;
      } else {
        worldX = (mouseX - prevPan.x) / prevScale;
        worldY = (mouseY - prevPan.y) / prevScale;

        newPanX = mouseX - worldX * newScale;
        newPanY = mouseY - worldY * newScale;
      }

      scaleRef.current = newScale;
      panRef.current = { x: newPanX, y: newPanY };

      setScaleState(newScale);
      setPanState({ x: newPanX, y: newPanY });
    };

    containerNode.addEventListener('wheel', handleWheel, { passive: false });
    return () => containerNode.removeEventListener('wheel', handleWheel);
  }, [containerNode, minScale, maxScale, zoomSensitivity, originMode]);

  // Window mouse move & up listeners for smooth panning
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
      if (e.button === 2 || e.button === 1 || isDraggingRef.current) {
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
  }, [setPan]);

  // Multi-touch gestures (Pinch to zoom + 2-finger pan)
  useEffect(() => {
    if (!containerNode) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistRef.current = Math.hypot(dx, dy);
        touchStartScaleRef.current = scaleRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDistRef.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const scaleChange = currentDist / touchStartDistRef.current;
        const newScale = Math.min(Math.max(touchStartScaleRef.current * scaleChange, minScale), maxScale);
        setScale(newScale);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchStartDistRef.current = null;
      }
    };

    containerNode.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerNode.addEventListener('touchmove', handleTouchMove, { passive: false });
    containerNode.addEventListener('touchend', handleTouchEnd);
    return () => {
      containerNode.removeEventListener('touchstart', handleTouchStart);
      containerNode.removeEventListener('touchmove', handleTouchMove);
      containerNode.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerNode, minScale, maxScale, setScale]);

  // Handlers to attach to container
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2 || e.button === 1 || (e.button === 0 && isSpaceDownRef.current)) {
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
    scaleRef.current = initialScale;
    setScaleState(initialScale);
    if (containerRef.current && canvasWidth && canvasHeight) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const centerX = (containerRect.width - canvasWidth * initialScale) / 2;
      const centerY = (containerRect.height - canvasHeight * initialScale) / 2;
      const newPan = { x: centerX, y: centerY };
      panRef.current = newPan;
      setPanState(newPan);
    } else {
      panRef.current = initialPan;
      setPanState(initialPan);
    }
  }, [initialScale, initialPan]);

  const centerContent = useCallback((contentWidth: number, contentHeight: number, targetScale = 1.0) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = (containerRect.width - contentWidth * targetScale) / 2;
    const centerY = (containerRect.height - contentHeight * targetScale) / 2;
    scaleRef.current = targetScale;
    setScaleState(targetScale);
    const newPan = { x: centerX, y: centerY };
    panRef.current = newPan;
    setPanState(newPan);
  }, []);

  const fitContent = useCallback((
    contentWidth: number,
    contentHeight: number,
    padding: number = 48,
    originX: number = 0,
    originY: number = 0
  ) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const availableWidth = Math.max(containerRect.width - padding * 2, 80);
    const availableHeight = Math.max(containerRect.height - padding * 2, 80);

    const scaleX = availableWidth / (contentWidth || 1);
    const scaleY = availableHeight / (contentHeight || 1);
    const targetScale = Math.min(Math.max(Math.min(scaleX, scaleY), minScale), maxScale);

    const centerX = (containerRect.width - contentWidth * targetScale) / 2 - originX * targetScale;
    const centerY = (containerRect.height - contentHeight * targetScale) / 2 - originY * targetScale;

    scaleRef.current = targetScale;
    panRef.current = { x: centerX, y: centerY };
    setScaleState(targetScale);
    setPanState({ x: centerX, y: centerY });
  }, [minScale, maxScale]);

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    const mouseX = container ? container.clientWidth / 2 : 0;
    const mouseY = container ? container.clientHeight / 2 : 0;

    const prevScale = scaleRef.current;
    const prevPan = panRef.current;
    const newScale = Math.min(prevScale * zoomSensitivity, maxScale);

    let worldX: number;
    let worldY: number;
    let newPanX: number;
    let newPanY: number;

    if (originMode === 'center') {
      const centerX = container ? container.clientWidth / 2 : 0;
      const centerY = container ? container.clientHeight / 2 : 0;
      worldX = (mouseX - (centerX + prevPan.x)) / prevScale;
      worldY = (mouseY - (centerY + prevPan.y)) / prevScale;

      newPanX = mouseX - centerX - worldX * newScale;
      newPanY = mouseY - centerY - worldY * newScale;
    } else {
      worldX = (mouseX - prevPan.x) / prevScale;
      worldY = (mouseY - prevPan.y) / prevScale;

      newPanX = mouseX - worldX * newScale;
      newPanY = mouseY - worldY * newScale;
    }

    const newPan = { x: newPanX, y: newPanY };
    scaleRef.current = newScale;
    panRef.current = newPan;
    setScaleState(newScale);
    setPanState(newPan);
  }, [zoomSensitivity, maxScale, originMode]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    const mouseX = container ? container.clientWidth / 2 : 0;
    const mouseY = container ? container.clientHeight / 2 : 0;

    const prevScale = scaleRef.current;
    const prevPan = panRef.current;
    const newScale = Math.max(prevScale / zoomSensitivity, minScale);

    let worldX: number;
    let worldY: number;
    let newPanX: number;
    let newPanY: number;

    if (originMode === 'center') {
      const centerX = container ? container.clientWidth / 2 : 0;
      const centerY = container ? container.clientHeight / 2 : 0;
      worldX = (mouseX - (centerX + prevPan.x)) / prevScale;
      worldY = (mouseY - (centerY + prevPan.y)) / prevScale;

      newPanX = mouseX - centerX - worldX * newScale;
      newPanY = mouseY - centerY - worldY * newScale;
    } else {
      worldX = (mouseX - prevPan.x) / prevScale;
      worldY = (mouseY - prevPan.y) / prevScale;

      newPanX = mouseX - worldX * newScale;
      newPanY = mouseY - worldY * newScale;
    }

    const newPan = { x: newPanX, y: newPanY };
    scaleRef.current = newScale;
    panRef.current = newPan;
    setScaleState(newScale);
    setPanState(newPan);
  }, [zoomSensitivity, minScale, originMode]);

  const setZoomPercent = useCallback((percent: number) => {
    const targetScale = Math.min(Math.max(percent / 100, minScale), maxScale);
    const container = containerRef.current;
    const mouseX = container ? container.clientWidth / 2 : 0;
    const mouseY = container ? container.clientHeight / 2 : 0;

    const prevScale = scaleRef.current;
    const prevPan = panRef.current;

    let worldX: number;
    let worldY: number;
    let newPanX: number;
    let newPanY: number;

    if (originMode === 'center') {
      const centerX = container ? container.clientWidth / 2 : 0;
      const centerY = container ? container.clientHeight / 2 : 0;
      worldX = (mouseX - (centerX + prevPan.x)) / prevScale;
      worldY = (mouseY - (centerY + prevPan.y)) / prevScale;

      newPanX = mouseX - centerX - worldX * targetScale;
      newPanY = mouseY - centerY - worldY * targetScale;
    } else {
      worldX = (mouseX - prevPan.x) / prevScale;
      worldY = (mouseY - prevPan.y) / prevScale;

      newPanX = mouseX - worldX * targetScale;
      newPanY = mouseY - worldY * targetScale;
    }

    const newPan = { x: newPanX, y: newPanY };
    scaleRef.current = targetScale;
    panRef.current = newPan;
    setScaleState(targetScale);
    setPanState(newPan);
  }, [minScale, maxScale, originMode]);

  return {
    scale,
    pan,
    isPanning,
    isSpaceDown,
    viewportSize,
    containerRef: combinedRef,
    handleMouseDown,
    handleContextMenu,
    resetView,
    centerContent,
    fitContent,
    zoomIn,
    zoomOut,
    setZoomPercent,
    setScale,
    setPan,
    screenToWorld,
    worldToScreen,
    snapToGrid
  };
}

// Helper alias for newScale calculation
function newScale(s: number) {
  return s;
}

export type UseMasonViewportReturn = ReturnType<typeof useMasonViewport>;

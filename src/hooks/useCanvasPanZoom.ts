import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';

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

  const [scale, setScaleState] = useState<number>(initialScale);
  const [pan, setPanState] = useState<{ x: number; y: number }>(initialPan);
  
  const scaleRef = useRef(initialScale);
  const panRef = useRef(initialPan);

  const setScale = useCallback((updater: number | ((s: number) => number)) => {
    setScaleState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      scaleRef.current = next;
      return next;
    });
  }, []);

  const setPan = useCallback((updater: {x:number, y:number} | ((p: {x:number, y:number}) => {x:number, y:number})) => {
    setPanState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      panRef.current = next;
      return next;
    });
  }, []);
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerNode, setContainerNode] = useState<HTMLDivElement | null>(null);

  // Callback ref that updates containerNode state so useEffect re-binds wheel events when container mounts or switches
  const setRef = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    setContainerNode(node);
  }, []);

  // Backwards compatibility getter/setter for containerRef.current
  const combinedRef = useMemo(() => {
    const fn = (node: HTMLDivElement | null) => setRef(node);
    Object.defineProperty(fn, 'current', {
      get() { return containerRef.current; },
      set(val: HTMLDivElement | null) { setRef(val); },
      configurable: true
    });
    return fn as unknown as React.RefObject<HTMLDivElement>;
  }, [setRef]);

    const isSpaceDownRef = useRef<boolean>(false);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        isSpaceDownRef.current = true;
        (window as any).__isSpaceDown = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDownRef.current = false;
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
      
      const prevScale = scaleRef.current;
      const prevPan = panRef.current;
      
      const newScale = Math.min(Math.max(prevScale * factor, minScale), maxScale);
      if (Math.abs(newScale - prevScale) < 0.0001) return;
      
      // World point before zoom
      const worldX = (mouseX - prevPan.x) / prevScale;
      const worldY = (mouseY - prevPan.y) / prevScale;
      
      // New pan to keep world point fixed under cursor
      const newPanX = mouseX - worldX * newScale;
      const newPanY = mouseY - worldY * newScale;
      
      scaleRef.current = newScale;
      panRef.current = { x: newPanX, y: newPanY };
      
      setScaleState(newScale);
      setPanState({ x: newPanX, y: newPanY });
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
  }, []);

  // Handlers to attach to container
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2 || e.button === 1 || (e.button === 0 && isSpaceDownRef.current)) {
      // Right click or middle click pan
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

  const centerContent = useCallback((canvasWidth: number, canvasHeight: number, targetScale = 1.0) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = (containerRect.width - canvasWidth * targetScale) / 2;
    const centerY = (containerRect.height - canvasHeight * targetScale) / 2;
    scaleRef.current = targetScale;
    setScaleState(targetScale);
    const newPan = { x: centerX, y: centerY };
    panRef.current = newPan;
    setPanState(newPan);
  }, []);

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    const mouseX = container ? container.clientWidth / 2 : 0;
    const mouseY = container ? container.clientHeight / 2 : 0;
    
    const prevScale = scaleRef.current;
    const prevPan = panRef.current;
    const newScale = Math.min(prevScale * zoomSensitivity, maxScale);
    
    const worldX = (mouseX - prevPan.x) / prevScale;
    const worldY = (mouseY - prevPan.y) / prevScale;
    
    const newPan = {
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale
    };
    
    scaleRef.current = newScale;
    panRef.current = newPan;
    setScaleState(newScale);
    setPanState(newPan);
  }, [zoomSensitivity, maxScale]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    const mouseX = container ? container.clientWidth / 2 : 0;
    const mouseY = container ? container.clientHeight / 2 : 0;
    
    const prevScale = scaleRef.current;
    const prevPan = panRef.current;
    const newScale = Math.max(prevScale / zoomSensitivity, minScale);
    
    const worldX = (mouseX - prevPan.x) / prevScale;
    const worldY = (mouseY - prevPan.y) / prevScale;
    
    const newPan = {
      x: mouseX - worldX * newScale,
      y: mouseY - worldY * newScale
    };
    
    scaleRef.current = newScale;
    panRef.current = newPan;
    setScaleState(newScale);
    setPanState(newPan);
  }, [zoomSensitivity, minScale]);

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

  return {
    scale,
    pan,
    isPanning,
    containerRef: combinedRef,
    handleMouseDown,
    handleContextMenu,
    resetView,
    centerContent,
    fitContent,
    zoomIn,
    zoomOut,
    setScale,
    setPan
  };
}

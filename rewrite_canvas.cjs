const fs = require('fs');
let code = fs.readFileSync('src/components/RefinedMapCanvas.tsx', 'utf8');

// 1. Imports
code = code.replace(
  "import { useMasonViewport, ViewportHUD } from './shared/viewport';",
  "import { useMasonViewport, ViewportHUD, ViewportCanvasContainer } from './shared/viewport';"
);

// 2. useMasonViewport assignment
code = code.replace(
  `  const {
    scale,
    pan,
    isPanning,
    containerRef,
    handleMouseDown: handlePanMouseDown,
    handleContextMenu,
    centerContent,
    fitContent,
    zoomIn,
    zoomOut,
    setPan,
    viewportSize
  } = useMasonViewport({
    minScale: 0.15,
    maxScale: 4.0,
    initialScale: 0.8,
    zoomSensitivity: 1.15
  });`,
  `  const viewport = useMasonViewport({
    minScale: 0.15,
    maxScale: 4.0,
    initialScale: 0.8,
    zoomSensitivity: 1.15
  });
  const {
    scale,
    pan,
    isPanning,
    containerRef,
    handleContextMenu,
    centerContent,
    fitContent,
    zoomIn,
    zoomOut,
    setPan,
    viewportSize
  } = viewport;`
);

// 3. handleContainerPointerDown
code = code.replace(
  `    if ('button' in e) {
      const btn = (e as React.MouseEvent).button;
      const isSpace = (window as any).__isSpaceDown || false;
      if (btn === 2 || btn === 1 || (btn === 0 && isSpace)) {
        handlePanMouseDown(e as React.MouseEvent);
        return;
      }
    }`,
  `    if ('button' in e) {
      const btn = (e as React.MouseEvent).button;
      const isSpace = viewport.isSpaceDown;
      if (btn === 2 || btn === 1 || (btn === 0 && isSpace)) {
        return; // Bubble up to ViewportCanvasContainer to handle panning
      }
    }`
);

// 4. mode === play preventDefault -> stopPropagation
code = code.replace(
  `    // PLAY MODE: Direct interactive combat & skill triggers
    if (mode === 'play') {
      if ('button' in e) {`,
  `    // PLAY MODE: Direct interactive combat & skill triggers
    if (mode === 'play') {
      e.stopPropagation(); // Prevent bubbling to pan handler
      if ('button' in e) {`
);

// 5. Replace wrapper and ViewportHUD
const wrapperStart = `    <div \n      ref={containerRef}\n      onMouseDown={handleContainerPointerDown}`;
const replaceStartCode = `    <ViewportCanvasContainer 
      viewport={viewport}
      cursorMode={mode === 'play' ? 'crosshair' : 'crosshair'}
      showHud={false}
      className="border border-neutral-800 rounded-none"
    >
      <div 
        className="absolute inset-0 z-0 w-full h-full"
        onMouseDown={handleContainerPointerDown}`;
code = code.replace(wrapperStart, replaceStartCode);

// The original ViewportHUD at the bottom of the paint mode should just be removed from where it is and we can use it? No, wait!
// If I use `showHud={false}` on ViewportCanvasContainer, I can just leave the existing `<ViewportHUD>` exactly where it is in the JSX!
// That's much safer because the existing ViewportHUD has complex `leadingSlot` and `trailingSlot` logic.
// All I need to do is close the inner `<div className="absolute inset-0 z-0">` at the bottom before the `</ViewportCanvasContainer>`.
const oldEnding = `      {mode === 'paint' && (
        <ViewportHUD`;
code = code.replace(oldEnding, `      </div>\n      {mode === 'paint' && (\n        <ViewportHUD`);

const finalEnding = `        </ViewportHUD>
      )}

    </div>
  );
};`;
code = code.replace(finalEnding, `        </ViewportHUD>\n      )}\n    </ViewportCanvasContainer>\n  );\n};`);

// Wait, the inner div needs to wrap everything except the HUD?
// No, the inner div just needs to wrap the canvas and overlays.
// If I wrap everything up to ViewportHUD in the inner div, that works.
// Actually, I can just leave ViewportHUD outside the inner div, inside ViewportCanvasContainer.

fs.writeFileSync('src/components/RefinedMapCanvas.tsx', code);

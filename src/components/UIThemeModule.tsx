import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MasonProject, 
  UIThemeFile, 
  UIConfigData,
  UIThemeStyling,
  UICornerRoundness,
  UIThemePreset,
  UIMenuScreen,
  UICustomWidget,
  UIButtonActionType,
  InputMapping,
  DEFAULT_UI_THEMES,
  UNIFIED_INPUT_TEMPLATE,
  ensureUIConfigDefaults
} from '../engine/masonProjectSchema';
import { getSavedModuleTab, saveModuleTab } from '../utils/moduleTabStore';
import { FileSubfolderHeader } from './FileSubfolderHeader';
import { 
  Layout, 
  Sparkles, 
  Eye, 
  Check, 
  Sliders, 
  Palette,
  Maximize2,
  Gamepad2,
  Plus,
  Trash2,
  RotateCcw,
  X,
  Keyboard,
  Key,
  Play,
  Pause,
  Layers,
  Monitor,
  Smartphone,
  MousePointer,
  Move,
  Type,
  Square,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  SlidersHorizontal,
  Volume2,
  CheckCircle2,
  Copy,
  FolderOpen,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Shield,
  HelpCircle,
  Settings,
  Search,
  Grid,
  Zap,
  Activity,
  Compass,
  MessageSquare,
  Flame,
  CornerDownRight,
  LogOut,
  Sparkle,
  Lock,
  Unlock,
  Maximize,
  Minimize
} from 'lucide-react';

interface UIThemeModuleProps {
  project: MasonProject;
  onUpdateProject: (updater: (prev: MasonProject) => MasonProject) => void;
  onOpenFiles?: () => void;
  onBackToDashboard?: () => void;
}

type MainTab = 'menus_designer' | 'input_mappings';
type CanvasResolution = '16:9' | '4:3' | '21:9' | 'mobile';
type CanvasBackdrop = 'game_scene' | 'dark_void' | 'grid_cyber' | 'blueprint';

export const UIThemeModule: React.FC<UIThemeModuleProps> = ({
  project,
  onUpdateProject,
  onBackToDashboard
}) => {
  const uiFiles = project.fileSystem?.ui || [];
  const activeFileName = project.activeFiles?.uiFileName || uiFiles[0]?.fileName;
  const defaultUIThemeFile: UIThemeFile = {
    id: DEFAULT_UI_THEMES[0]?.id || 'ui_default',
    name: DEFAULT_UI_THEMES[0]?.name || 'Metroidvania HUD Theme',
    fileName: `${DEFAULT_UI_THEMES[0]?.id || 'default'}.ui`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    uiConfig: DEFAULT_UI_THEMES[0]
  };
  const currentUiFile: UIThemeFile = uiFiles.find(u => u.fileName === activeFileName) || uiFiles[0] || defaultUIThemeFile;

  // Active UI Configuration with guaranteed defaults
  const ui: UIConfigData = useMemo(() => {
    return ensureUIConfigDefaults(currentUiFile.uiConfig);
  }, [currentUiFile.uiConfig]);

  // Master UI Update Dispatcher
  const updateUI = (updater: (prev: UIConfigData) => UIConfigData) => {
    onUpdateProject(p => {
      const updated = p.fileSystem.ui.map(u => {
        if (u.fileName === currentUiFile.fileName) {
          const newConfig = updater(ensureUIConfigDefaults(u.uiConfig));
          return {
            ...u,
            updatedAt: new Date().toISOString(),
            uiConfig: newConfig
          };
        }
        return u;
      });
      return {
        ...p,
        fileSystem: { ...p.fileSystem, ui: updated }
      };
    });
  };

  // Main UI Navigation Tabs
  const [mainTab, setMainTabState] = useState<MainTab>(
    () => getSavedModuleTab('ui', 'menus_designer') as any
  );
  const setMainTab = (tab: MainTab) => {
    setMainTabState(tab);
    saveModuleTab('ui', tab);
  };
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [isStyleDrawerOpen, setIsStyleDrawerOpen] = useState<boolean>(false);
  const [canvasResolution, setCanvasResolution] = useState<CanvasResolution>('16:9');
  const [canvasBackdrop, setCanvasBackdrop] = useState<CanvasBackdrop>('game_scene');
  const [snapGridSize, setSnapGridSize] = useState<number>(8); // 0 = off, 4, 8, 16
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  // Active Selected Menu & Widget
  const activeMenuId = useMemo(() => {
    if (ui.menus && ui.menus.length > 0) {
      if (ui.initialMenuId && ui.menus.some(m => m.id === ui.initialMenuId)) {
        return ui.initialMenuId;
      }
      return ui.menus[0].id;
    }
    return 'menu_main_start';
  }, [ui.menus, ui.initialMenuId]);

  const [selectedMenuId, setSelectedMenuId] = useState<string>(activeMenuId);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [hoveredWidgetId, setHoveredWidgetId] = useState<string | null>(null);

  // Keep selectedMenuId valid
  useEffect(() => {
    if (ui.menus && ui.menus.length > 0 && !ui.menus.some(m => m.id === selectedMenuId)) {
      setSelectedMenuId(ui.menus[0].id);
      setSelectedWidgetId(null);
    }
  }, [ui.menus, selectedMenuId]);

  const currentMenu: UIMenuScreen = useMemo(() => {
    return ui.menus.find(m => m.id === selectedMenuId) || ui.menus[0] || {
      id: 'menu_main_start',
      name: 'Start Menu',
      widgets: []
    };
  }, [ui.menus, selectedMenuId]);

  const selectedWidget: UICustomWidget | null = useMemo(() => {
    if (!selectedWidgetId) return null;
    return currentMenu.widgets.find(w => w.id === selectedWidgetId) || null;
  }, [currentMenu.widgets, selectedWidgetId]);

  // Simulation & Test Mode State
  const [testActiveMenuId, setTestActiveMenuId] = useState<string>(selectedMenuId);
  const [isGamePaused, setIsGamePaused] = useState<boolean>(false);
  const [testInputValues, setTestInputValues] = useState<Record<string, string>>({});
  const [testSliderValues, setTestSliderValues] = useState<Record<string, number>>({});
  const [testToggleValues, setTestToggleValues] = useState<Record<string, boolean>>({});
  const [testActionFeedback, setTestActionFeedback] = useState<string | null>(null);
  const [testNavigationHistory, setTestNavigationHistory] = useState<string[]>([]);

  // Toast notification state for UI Theme Module
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  // Sync test mode active screen when switching to test mode
  useEffect(() => {
    if (isTestMode) {
      setTestActiveMenuId(selectedMenuId);
      setTestNavigationHistory([selectedMenuId]);
      // Initialize inputs/sliders
      const initialInputs: Record<string, string> = {};
      const initialSliders: Record<string, number> = {};
      const initialToggles: Record<string, boolean> = {};
      ui.menus.forEach(m => {
        m.widgets.forEach(w => {
          if (w.type === 'input_field') initialInputs[w.id] = w.text || '';
          if (w.type === 'slider') initialSliders[w.id] = w.value ?? 50;
          if (w.type === 'toggle') initialToggles[w.id] = w.checked ?? false;
        });
      });
      setTestInputValues(initialInputs);
      setTestSliderValues(initialSliders);
      setTestToggleValues(initialToggles);
    }
  }, [isTestMode, selectedMenuId, ui.menus]);

  const triggerActionFeedback = (msg: string) => {
    setTestActionFeedback(msg);
    setTimeout(() => {
      setTestActionFeedback(null);
    }, 2400);
  };

  // Dragging & Resizing State on Canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingWidget, setIsDraggingWidget] = useState<boolean>(false);
  const [dragStartPos, setDragStartPos] = useState<{ mouseX: number; mouseY: number; widgetX: number; widgetY: number } | null>(null);
  const [isResizingWidget, setIsResizingWidget] = useState<boolean>(false);
  const [resizeStartPos, setResizeStartPos] = useState<{ mouseX: number; mouseY: number; startW: number; startH: number } | null>(null);

  // Grid snap helper
  const snapVal = (val: number) => {
    if (snapGridSize <= 0) return Math.round(val);
    return Math.round(val / snapGridSize) * snapGridSize;
  };

  // Handle Drag Move on Window
  useEffect(() => {
    if (!isDraggingWidget && !isResizingWidget) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (isDraggingWidget && dragStartPos && selectedWidgetId) {
        const dx = e.clientX - dragStartPos.mouseX;
        const dy = e.clientY - dragStartPos.mouseY;
        const newX = Math.max(0, snapVal(dragStartPos.widgetX + dx));
        const newY = Math.max(0, snapVal(dragStartPos.widgetY + dy));

        updateUI(prevUI => ({
          ...prevUI,
          menus: prevUI.menus.map(m => {
            if (m.id === selectedMenuId) {
              return {
                ...m,
                widgets: m.widgets.map(w => w.id === selectedWidgetId ? { ...w, x: newX, y: newY } : w)
              };
            }
            return m;
          })
        }));
      } else if (isResizingWidget && resizeStartPos && selectedWidgetId) {
        const dx = e.clientX - resizeStartPos.mouseX;
        const dy = e.clientY - resizeStartPos.mouseY;
        const newW = Math.max(32, snapVal(resizeStartPos.startW + dx));
        const newH = Math.max(20, snapVal(resizeStartPos.startH + dy));

        updateUI(prevUI => ({
          ...prevUI,
          menus: prevUI.menus.map(m => {
            if (m.id === selectedMenuId) {
              return {
                ...m,
                widgets: m.widgets.map(w => w.id === selectedWidgetId ? { ...w, width: newW, height: newH } : w)
              };
            }
            return m;
          })
        }));
      }
    };

    const handlePointerUp = () => {
      setIsDraggingWidget(false);
      setIsResizingWidget(false);
      setDragStartPos(null);
      setResizeStartPos(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingWidget, isResizingWidget, dragStartPos, resizeStartPos, selectedWidgetId, selectedMenuId, snapGridSize]);

  // Key / Gamepad Recording State for Input Mappings
  interface RecordingTarget {
    mappingIdx: number;
    targetType: 'keys' | 'gamepadButtons';
    actionLabel: string;
  }
  const [recordingTarget, setRecordingTarget] = useState<RecordingTarget | null>(null);
  const [recordedValues, setRecordedValues] = useState<string[]>([]);
  const [currentlyHeldKeys, setCurrentlyHeldKeys] = useState<Set<string>>(new Set());
  const [inputSearchQuery, setInputSearchQuery] = useState<string>('');
  const [activeInputCategory, setActiveInputCategory] = useState<'all' | 'movement' | 'combat' | 'interaction' | 'navigation'>('all');

  // Listen for real-time key presses and controller buttons when modal is open
  useEffect(() => {
    if (!recordingTarget) return;

    const heldSet = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Tab', 'Space', 'Enter', 'Escape'].includes(e.code)) {
        e.preventDefault();
      }
      const keyName = e.code || e.key;
      heldSet.add(keyName);
      setCurrentlyHeldKeys(new Set(heldSet));

      const comboStr = Array.from(heldSet).join(' + ');
      setRecordedValues(prev => {
        if (prev.includes(comboStr)) return prev;
        return [...prev, comboStr];
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyName = e.code || e.key;
      heldSet.delete(keyName);
      setCurrentlyHeldKeys(new Set(heldSet));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Gamepad Polling Loop
    let animFrameId: number;
    const GAMEPAD_BUTTON_NAMES: Record<number, string> = {
      0: 'ButtonSouth / A',
      1: 'ButtonEast / B',
      2: 'ButtonWest / X',
      3: 'ButtonNorth / Y',
      4: 'LeftBumper / LB',
      5: 'RightBumper / RB',
      6: 'LeftTrigger / LT',
      7: 'RightTrigger / RT',
      8: 'Select / Back',
      9: 'Start / Pause',
      10: 'LeftStickClick',
      11: 'RightStickClick',
      12: 'DPadUp',
      13: 'DPadDown',
      14: 'DPadLeft',
      15: 'DPadRight'
    };

    const pressedGpSet = new Set<string>();

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      if (gamepads) {
        for (const gp of gamepads) {
          if (gp && gp.buttons) {
            gp.buttons.forEach((btn, idx) => {
              const name = GAMEPAD_BUTTON_NAMES[idx] || `Button_${idx}`;
              if (btn.pressed) {
                if (!pressedGpSet.has(name)) {
                  pressedGpSet.add(name);
                  setRecordedValues(prev => prev.includes(name) ? prev : [...prev, name]);
                }
              } else {
                pressedGpSet.delete(name);
              }
            });
          }
        }
      }
      animFrameId = requestAnimationFrame(pollGamepad);
    };

    animFrameId = requestAnimationFrame(pollGamepad);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animFrameId);
    };
  }, [recordingTarget]);

  // Global styling tokens
  const styling = ui.styling || DEFAULT_UI_THEMES[0].styling!;
  const colors = styling.colors;
  const computedRadiusPx = useMemo(() => {
    switch (styling.roundness) {
      case 'sharp': return 0;
      case 'subtle': return 4;
      case 'standard': return 8;
      case 'smooth': return 16;
      case 'pill': return 9999;
      case 'custom': return styling.customRadiusPx ?? 8;
      default: return 8;
    }
  }, [styling.roundness, styling.customRadiusPx]);

  const computedFontClass = useMemo(() => {
    switch (styling.fontFamily) {
      case 'pixel': return 'font-mono tracking-tight';
      case 'serif_gothic': return 'font-serif tracking-wide';
      case 'mono_scifi': return 'font-mono uppercase tracking-wider';
      case 'sans_modern': return 'font-sans tracking-normal';
      default: return 'font-sans';
    }
  }, [styling.fontFamily]);

  // Widget Addition Helper
  const handleAddWidget = (type: UICustomWidget['type']) => {
    const id = `w_${type}_${Date.now()}`;
    const nextOffset = (currentMenu.widgets.length * 28) % 200;
    let newWidget: UICustomWidget;

    switch (type) {
      case 'button':
        newWidget = {
          id,
          name: `Action Button ${currentMenu.widgets.length + 1}`,
          type: 'button',
          x: 48,
          y: 60 + nextOffset,
          width: 280,
          height: 48,
          text: 'NEW ACTION BUTTON',
          icon: '⚔️',
          isPrimary: true,
          action: 'navigate_menu',
          targetMenuId: ui.menus[0]?.id || 'menu_main_start',
          pauseAction: 'none',
          backgroundColor: colors.primaryAccent,
          color: '#ffffff',
          borderRadius: computedRadiusPx,
          animationTrigger: 'on_hover_grow'
        };
        break;
      case 'text':
        newWidget = {
          id,
          name: `Text Box ${currentMenu.widgets.length + 1}`,
          type: 'text',
          x: 48,
          y: 40 + nextOffset,
          width: 360,
          height: 44,
          text: 'HEADER TITLE OR INSTRUCTION',
          fontSize: 22,
          textAlign: 'left',
          color: colors.primaryAccent
        };
        break;
      case 'input_field':
        newWidget = {
          id,
          name: `Input Field ${currentMenu.widgets.length + 1}`,
          type: 'input_field',
          x: 48,
          y: 60 + nextOffset,
          width: 300,
          height: 46,
          text: 'Hero_01',
          placeholder: 'Enter text here...',
          inputType: 'text',
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          color: '#ffffff',
          borderRadius: computedRadiusPx
        };
        break;
      case 'progress_bar':
        newWidget = {
          id,
          name: `Progress Bar ${currentMenu.widgets.length + 1}`,
          type: 'progress_bar',
          x: 48,
          y: 60 + nextOffset,
          width: 280,
          height: 24,
          text: 'GAUGE CAPACITY: 75%',
          value: 75,
          minValue: 0,
          maxValue: 100,
          color: colors.healthColor,
          backgroundColor: '#27272a'
        };
        break;
      case 'slider':
        newWidget = {
          id,
          name: `Option Slider ${currentMenu.widgets.length + 1}`,
          type: 'slider',
          x: 48,
          y: 60 + nextOffset,
          width: 300,
          height: 48,
          text: 'Audio Volume',
          value: 80,
          minValue: 0,
          maxValue: 100,
          step: 1,
          unit: '%',
          color: colors.primaryAccent
        };
        break;
      case 'toggle':
        newWidget = {
          id,
          name: `Setting Switch ${currentMenu.widgets.length + 1}`,
          type: 'toggle',
          x: 48,
          y: 60 + nextOffset,
          width: 280,
          height: 40,
          text: 'Enable Particle Effects',
          checked: true
        };
        break;
      case 'card':
        newWidget = {
          id,
          name: `Panel Card ${currentMenu.widgets.length + 1}`,
          type: 'card',
          x: 48,
          y: 60 + nextOffset,
          width: 340,
          height: 180,
          text: 'Card Container\n\nPlace content, descriptions, or stat summaries inside.',
          backgroundColor: '#18181be6',
          borderColor: colors.cardBorder,
          borderRadius: computedRadiusPx
        };
        break;
      case 'image':
        newWidget = {
          id,
          name: `Icon / Emblem ${currentMenu.widgets.length + 1}`,
          type: 'image',
          x: 48,
          y: 60 + nextOffset,
          width: 80,
          height: 80,
          icon: '👑',
          backgroundColor: '#27272a',
          borderColor: colors.primaryAccent,
          borderRadius: computedRadiusPx
        };
        break;
      case 'badge':
        newWidget = {
          id,
          name: `Badge Pill ${currentMenu.widgets.length + 1}`,
          type: 'badge',
          x: 48,
          y: 60 + nextOffset,
          width: 140,
          height: 32,
          text: 'ALPHA BUILD',
          icon: '⚡',
          backgroundColor: '#3b0764',
          borderColor: '#a855f7',
          color: '#e9d5ff',
          borderRadius: 9999
        };
        break;
      default:
        return;
    }

    updateUI(prevUI => ({
      ...prevUI,
      menus: prevUI.menus.map(m => {
        if (m.id === selectedMenuId) {
          return {
            ...m,
            widgets: [...m.widgets, newWidget]
          };
        }
        return m;
      })
    }));

    setSelectedWidgetId(id);
    triggerActionFeedback(`Added ${newWidget.name}`);
  };

  // Menu Management Helpers
  const handleCreateMenu = () => {
    const newId = `menu_${Date.now()}`;
    const newName = `Menu Screen ${ui.menus.length + 1}`;
    const newMenu: UIMenuScreen = {
      id: newId,
      name: newName,
      description: 'Custom interactive screen',
      widgets: [
        {
          id: `w_title_${Date.now()}`,
          name: 'Screen Header',
          type: 'text',
          x: 48,
          y: 40,
          width: 440,
          height: 48,
          text: newName.toUpperCase(),
          fontSize: 26,
          color: colors.primaryAccent,
          textAlign: 'left'
        },
        {
          id: `w_btn_back_${Date.now()}`,
          name: 'Back Button',
          type: 'button',
          x: 48,
          y: 120,
          width: 240,
          height: 44,
          text: 'RETURN TO PREVIOUS',
          icon: '⬅️',
          action: 'navigate_menu',
          targetMenuId: selectedMenuId,
          pauseAction: 'none',
          backgroundColor: colors.cardBg,
          borderColor: colors.cardBorder,
          color: '#ffffff',
          borderRadius: computedRadiusPx
        }
      ]
    };

    updateUI(prev => ({
      ...prev,
      menus: [...prev.menus, newMenu]
    }));
    setSelectedMenuId(newId);
    setSelectedWidgetId(null);
    triggerActionFeedback(`Created "${newName}"`);
  };

  const handleDuplicateMenu = (menuToDup: UIMenuScreen) => {
    const newId = `menu_${Date.now()}`;
    const newName = `${menuToDup.name} (Copy)`;
    const duplicatedWidgets = menuToDup.widgets.map((w, idx) => ({
      ...w,
      id: `w_dup_${Date.now()}_${idx}`
    }));

    const newMenu: UIMenuScreen = {
      ...menuToDup,
      id: newId,
      name: newName,
      isInitialScreen: false,
      widgets: duplicatedWidgets
    };

    updateUI(prev => ({
      ...prev,
      menus: [...prev.menus, newMenu]
    }));
    setSelectedMenuId(newId);
    triggerActionFeedback(`Duplicated as "${newName}"`);
  };

  const handleDeleteMenu = (menuIdToDelete: string) => {
    if (ui.menus.length <= 1) {
      triggerActionFeedback("Cannot delete the only menu screen");
      return;
    }
    const remaining = ui.menus.filter(m => m.id !== menuIdToDelete);
    const wasInitial = ui.initialMenuId === menuIdToDelete || currentMenu.isInitialScreen;
    const wasPause = ui.pauseMenuId === menuIdToDelete || currentMenu.isPauseMenu;
    updateUI(prev => ({
      ...prev,
      initialMenuId: wasInitial ? undefined : prev.initialMenuId,
      pauseMenuId: wasPause ? undefined : prev.pauseMenuId,
      menus: remaining.map(m => ({
        ...m,
        isInitialScreen: wasInitial ? false : Boolean(m.isInitialScreen),
        isPauseMenu: wasPause ? false : Boolean(m.isPauseMenu)
      }))
    }));
    setSelectedMenuId(remaining[0].id);
    setSelectedWidgetId(null);
    triggerActionFeedback("Menu deleted");
  };

  // Test Mode Button Click Execution
  const handleTestButtonClick = (widget: UICustomWidget) => {
    // 1. Handle Pause Checkbox / Action Behavior
    if (widget.pauseAction === 'pause') {
      setIsGamePaused(true);
      triggerActionFeedback("⏸️ Game Engine: PAUSED");
    } else if (widget.pauseAction === 'unpause') {
      setIsGamePaused(false);
      triggerActionFeedback("▶️ Game Engine: RUNNING");
    } else if (widget.pauseAction === 'toggle_pause') {
      setIsGamePaused(prev => !prev);
      triggerActionFeedback(isGamePaused ? "▶️ Game Engine: RUNNING" : "⏸️ Game Engine: PAUSED");
    }

    // 2. Handle Primary Button Navigation / Action
    switch (widget.action) {
      case 'navigate_menu':
        if (widget.targetMenuId && ui.menus.some(m => m.id === widget.targetMenuId)) {
          setTestNavigationHistory(prev => [...prev, widget.targetMenuId!]);
          setTestActiveMenuId(widget.targetMenuId);
          triggerActionFeedback(`Navigated to "${ui.menus.find(m => m.id === widget.targetMenuId)?.name}"`);
        } else {
          triggerActionFeedback("No target menu linked to this button");
        }
        break;
      case 'close_menu':
        if (testNavigationHistory.length > 1) {
          const updated = [...testNavigationHistory];
          updated.pop();
          const prevId = updated[updated.length - 1];
          setTestNavigationHistory(updated);
          setTestActiveMenuId(prevId);
          triggerActionFeedback("Returned to previous menu");
        } else if (ui.initialMenuId) {
          setTestActiveMenuId(ui.initialMenuId);
          triggerActionFeedback("Closed menu");
        }
        break;
      case 'start_game':
        setIsGamePaused(false);
        triggerActionFeedback("⚔️ START GAME: Loading World Biomes...");
        break;
      case 'resume_game':
        setIsGamePaused(false);
        triggerActionFeedback("▶️ RESUME GAME: Unpausing active scene");
        break;
      case 'quit_game':
        setIsGamePaused(false);
        if (ui.initialMenuId) setTestActiveMenuId(ui.initialMenuId);
        triggerActionFeedback("🚪 RETURNED TO TITLE");
        break;
      case 'custom_event':
        triggerActionFeedback(`⚡ Event Triggered: "${widget.customEventName || 'on_action_click'}"`);
        break;
      default:
        triggerActionFeedback(`Clicked "${widget.text || widget.name}"`);
        break;
    }
  };

  // Rendering screen inside test or design mode
  const displayedMenu = isTestMode 
    ? (ui.menus.find(m => m.id === testActiveMenuId) || currentMenu)
    : currentMenu;

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-950 overflow-hidden select-none font-sans text-neutral-100">
      {/* 1. Subfolder File Header */}
      <FileSubfolderHeader
        subfolderName="ui"
        extension=".ui"
        onBackToDashboard={onBackToDashboard}
        centerContent={
          <div className="flex items-center gap-2 max-w-full truncate">
            <span className="text-base">🎨</span>
            <input
              type="text"
              value={ui.themeName || ui.name}
              onChange={(e) => updateUI(u => ({ ...u, themeName: e.target.value, name: e.target.value }))}
              className="bg-transparent text-xs font-bold text-white border-b border-dashed border-neutral-700 hover:border-emerald-500 focus:border-emerald-500 focus:outline-none transition py-0.5 max-w-[160px] sm:max-w-[240px] text-center"
              title="Click to edit UI theme file name"
            />
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
              {styling.preset.replace('_', ' ')}
            </span>
          </div>
        }
        files={project.fileSystem.ui.map(u => ({
          id: u.id,
          name: u.name,
          fileName: u.fileName,
          updatedAt: u.updatedAt
        }))}
        activeFileName={currentUiFile.fileName}
        onSelectFile={(fName) => {
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, uiFileName: fName }
          }));
        }}
        onNewFile={(name) => {
          const safeName = `${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ui`;
          const newU: UIThemeFile = {
            id: `ui_${Date.now()}`,
            name,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            uiConfig: {
              ...DEFAULT_UI_THEMES[0],
              id: `ui_${Date.now()}`,
              name,
              themeName: name
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, uiFileName: safeName },
            fileSystem: { ...p.fileSystem, ui: [...p.fileSystem.ui, newU] }
          }));
        }}
        onDuplicateFile={(fName) => {
          const orig = project.fileSystem.ui.find(u => u.fileName === fName);
          if (!orig) return;
          const safeName = `copy_${orig.fileName}`;
          const dup: UIThemeFile = {
            ...orig,
            id: `ui_${Date.now()}`,
            name: `${orig.name} (Copy)`,
            fileName: safeName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            uiConfig: {
              ...orig.uiConfig,
              id: `ui_${Date.now()}`,
              name: `${orig.name} (Copy)`
            }
          };
          onUpdateProject(p => ({
            ...p,
            activeFiles: { ...p.activeFiles, uiFileName: safeName },
            fileSystem: { ...p.fileSystem, ui: [...p.fileSystem.ui, dup] }
          }));
        }}
        onSaveFile={() => {
          updateUI(u => ({ ...u, updatedAt: new Date().toISOString() }));
          showToast(`Saved UI theme "${ui.name || currentUiFile.name}" (${currentUiFile.fileName})`, 'success');
        }}
        onExportFile={(fName) => {
          const target = project.fileSystem.ui.find(u => u.fileName === fName);
          if (!target) return;
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(target, null, 2));
          const downloadAnchor = document.createElement('a');
          downloadAnchor.setAttribute("href", dataStr);
          downloadAnchor.setAttribute("download", target.fileName);
          document.body.appendChild(downloadAnchor);
          downloadAnchor.click();
          downloadAnchor.remove();
        }}
        onRenameFile={(oldFileName, newName) => {
          const safeName = `${newName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ui`;
          onUpdateProject(p => {
            const updated = p.fileSystem.ui.map(u => {
              if (u.fileName === oldFileName) {
                return { ...u, name: newName, fileName: safeName, updatedAt: new Date().toISOString() };
              }
              return u;
            });
            return {
              ...p,
              activeFiles: {
                ...p.activeFiles,
                uiFileName: p.activeFiles?.uiFileName === oldFileName ? safeName : p.activeFiles?.uiFileName
              },
              fileSystem: { ...p.fileSystem, ui: updated }
            };
          });
        }}
        onDeleteFile={(fName) => {
          if (project.fileSystem.ui.length <= 1) return;
          const remaining = project.fileSystem.ui.filter(u => u.fileName !== fName);
          onUpdateProject(p => ({
            ...p,
            activeFiles: {
              ...p.activeFiles,
              uiFileName: p.activeFiles?.uiFileName === fName ? remaining[0].fileName : p.activeFiles?.uiFileName
            },
            fileSystem: { ...p.fileSystem, ui: remaining }
          }));
        }}
      />

      {/* 2. Top Module Toolbar with Tabs & Controls */}
      <div className="h-12 bg-neutral-900/90 border-b border-neutral-800 px-4 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Main Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainTab('menus_designer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'menus_designer'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-750'
            }`}
          >
            <Layout size={14} />
            <span>UI Menus & Screens Designer</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('input_mappings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
              mainTab === 'input_mappings'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-750'
            }`}
          >
            <Gamepad2 size={14} />
            <span>Input Mappings</span>
          </button>
        </div>

        {/* Center / Right: Designer Quick Controls */}
        {mainTab === 'menus_designer' && (
          <div className="flex items-center gap-2.5">
            {/* Snap Grid Toggle */}
            <div className="hidden lg:flex items-center gap-1.5 bg-neutral-950 px-2 py-1 rounded-lg border border-neutral-800 text-xs">
              <Grid size={13} className="text-neutral-400" />
              <span className="text-neutral-400 text-[11px]">Snap:</span>
              <select
                value={snapGridSize}
                onChange={(e) => setSnapGridSize(Number(e.target.value))}
                className="bg-neutral-900 text-neutral-200 text-[11px] font-mono rounded px-1.5 py-0.5 border border-neutral-700 focus:outline-none"
              >
                <option value={0}>Free (Off)</option>
                <option value={4}>4px</option>
                <option value={8}>8px</option>
                <option value={16}>16px</option>
                <option value={32}>32px</option>
              </select>
            </div>

            {/* Resolution Selector */}
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setCanvasResolution('16:9')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${canvasResolution === '16:9' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="16:9 Landscape"
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => setCanvasResolution('4:3')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${canvasResolution === '4:3' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="4:3 Retro Display"
              >
                4:3
              </button>
              <button
                type="button"
                onClick={() => setCanvasResolution('mobile')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${canvasResolution === 'mobile' ? 'bg-neutral-800 text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'}`}
                title="Mobile / Vertical View"
              >
                📱 Mobile
              </button>
            </div>

            {/* Backdrop Art Switcher */}
            <select
              value={canvasBackdrop}
              onChange={(e) => setCanvasBackdrop(e.target.value as CanvasBackdrop)}
              className="bg-neutral-950 border border-neutral-800 rounded-lg text-[11px] px-2 py-1 text-neutral-300 focus:outline-none hidden md:block"
              title="Canvas background simulator"
            >
              <option value="game_scene">Backdrop: Metroidvania Scene</option>
              <option value="dark_void">Backdrop: Pure Dark Void</option>
              <option value="grid_cyber">Backdrop: Blueprint Grid</option>
            </select>

            {/* Global Theme & Styles Drawer Toggle */}
            <button
              type="button"
              onClick={() => setIsStyleDrawerOpen(prev => !prev)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
                isStyleDrawerOpen
                  ? 'bg-purple-950 border-purple-500/80 text-purple-200'
                  : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
              title="Global Theme Presets, Colors & Corner Roundness"
            >
              <Palette size={13} className="text-purple-400" />
              <span className="hidden sm:inline">Theme & Styling</span>
            </button>

            {/* Design / Test Mode Toggle Button */}
            <button
              type="button"
              onClick={() => setIsTestMode(prev => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                isTestMode
                  ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700'
              }`}
            >
              {isTestMode ? <Play size={13} className="fill-current" /> : <MousePointer size={13} />}
              <span>{isTestMode ? 'Testing Live (Click to Edit)' : 'Test Mode'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Action Feedback Notification */}
      {testActionFeedback && (
        <div className="fixed top-14 right-6 z-50 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none">
          <div className="bg-emerald-950/95 border border-emerald-500/70 text-emerald-200 px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>{testActionFeedback}</span>
          </div>
        </div>
      )}

      {/* 4. MAIN CONTENT AREA */}
      {mainTab === 'menus_designer' ? (
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* LEFT SIDEBAR: MENUS LIST & ELEMENT TOOLBOX */}
          <div className="w-72 bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 overflow-y-auto">
            {/* Section A: Menus & Screens Management */}
            <div className="p-3 border-b border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Layers size={14} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">Menus & Screens</span>
                </div>
                <button
                  type="button"
                  onClick={handleCreateMenu}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                  title="Create new menu screen"
                >
                  <Plus size={12} />
                  <span>New Menu</span>
                </button>
              </div>

              {/* Menu list */}
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {ui.menus.map(menu => {
                  const isActive = menu.id === selectedMenuId;
                  const isInitial = menu.isInitialScreen || menu.id === ui.initialMenuId;
                  const isPause = menu.isPauseMenu || menu.id === ui.pauseMenuId;
                  return (
                    <div
                      key={menu.id}
                      onClick={() => {
                        setSelectedMenuId(menu.id);
                        setSelectedWidgetId(null);
                        if (isTestMode) setTestActiveMenuId(menu.id);
                      }}
                      className={`w-full text-left p-2 rounded-lg border transition flex items-center justify-between cursor-pointer group ${
                        isActive
                          ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 shadow-sm'
                          : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:bg-neutral-850 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs">📜</span>
                        <div className="truncate">
                          <div className="text-xs font-bold truncate flex items-center gap-1.5">
                            <span className="truncate">{menu.name}</span>
                            {isInitial && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono">
                                Start
                              </span>
                            )}
                            {isPause && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-500/40 font-mono">
                                Pause
                              </span>
                            )}
                            {menu.isOverlay && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono">
                                Overlay
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-500 font-mono">
                            {menu.widgets.length} elements
                          </div>
                        </div>
                      </div>

                      {/* Quick duplicate / delete on hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateMenu(menu);
                          }}
                          className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
                          title="Duplicate Menu"
                        >
                          <Copy size={11} />
                        </button>
                        {ui.menus.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMenu(menu.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-950"
                            title="Delete Menu"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section B: Add Elements Toolbox */}
            <div className="p-3 border-b border-neutral-800 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <Plus size={13} className="text-emerald-400" />
                <span>Add Element</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAddWidget('button')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <span className="text-sm">🔘</span>
                  <div className="truncate">
                    <div>Button</div>
                    <div className="text-[9px] text-neutral-500">Action / Link</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWidget('text')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <Type size={14} className="text-cyan-400" />
                  <div className="truncate">
                    <div>Text Box</div>
                    <div className="text-[9px] text-neutral-500">Title / Label</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWidget('input_field')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <span className="text-sm">💬</span>
                  <div className="truncate">
                    <div>Input Field</div>
                    <div className="text-[9px] text-neutral-500">Text entry</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWidget('progress_bar')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <Activity size={14} className="text-red-400" />
                  <div className="truncate">
                    <div>Progress Bar</div>
                    <div className="text-[9px] text-neutral-500">Health/Mana</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWidget('slider')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <SlidersHorizontal size={14} className="text-purple-400" />
                  <div className="truncate">
                    <div>Slider</div>
                    <div className="text-[9px] text-neutral-500">Value drag</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWidget('toggle')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <span className="text-sm">🎚️</span>
                  <div className="truncate">
                    <div>Toggle</div>
                    <div className="text-[9px] text-neutral-500">On / Off switch</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWidget('card')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <Square size={14} className="text-amber-400" />
                  <div className="truncate">
                    <div>Panel Card</div>
                    <div className="text-[9px] text-neutral-500">Container</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddWidget('image')}
                  className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/60 hover:bg-neutral-850 transition text-left flex items-center gap-2 text-xs font-semibold text-neutral-200"
                >
                  <span className="text-sm">🖼️</span>
                  <div className="truncate">
                    <div>Icon / Image</div>
                    <div className="text-[9px] text-neutral-500">Emblem</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Section C: Layers & Element Hierarchy */}
            <div className="p-3 flex-1 flex flex-col min-h-0 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                <span>Layers ({currentMenu.widgets.length})</span>
                <span className="text-[10px] text-neutral-500 font-mono">Top to bottom</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {currentMenu.widgets.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-500 italic">
                    No elements yet. Click an element type above to add.
                  </div>
                ) : (
                  currentMenu.widgets.map((widget, idx) => {
                    const isSel = widget.id === selectedWidgetId;
                    return (
                      <div
                        key={widget.id}
                        onClick={() => setSelectedWidgetId(widget.id)}
                        className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition ${
                          isSel
                            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-850'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-xs">
                            {widget.type === 'button' ? '🔘' : widget.type === 'input_field' ? '💬' : widget.type === 'text' ? '📝' : widget.type === 'slider' ? '🎚️' : widget.type === 'progress_bar' ? '📊' : widget.type === 'toggle' ? '🔘' : '🗃️'}
                          </span>
                          <span className="truncate font-semibold">{widget.name || widget.text || widget.id}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Move widget up in array
                              if (idx > 0) {
                                const arr = [...currentMenu.widgets];
                                const temp = arr[idx];
                                arr[idx] = arr[idx - 1];
                                arr[idx - 1] = temp;
                                updateUI(prev => ({
                                  ...prev,
                                  menus: prev.menus.map(m => m.id === selectedMenuId ? { ...m, widgets: arr } : m)
                                }));
                              }
                            }}
                            className="text-neutral-500 hover:text-white p-0.5 rounded text-[10px]"
                            title="Bring Forward"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Move widget down in array
                              if (idx < currentMenu.widgets.length - 1) {
                                const arr = [...currentMenu.widgets];
                                const temp = arr[idx];
                                arr[idx] = arr[idx + 1];
                                arr[idx + 1] = temp;
                                updateUI(prev => ({
                                  ...prev,
                                  menus: prev.menus.map(m => m.id === selectedMenuId ? { ...m, widgets: arr } : m)
                                }));
                              }
                            }}
                            className="text-neutral-500 hover:text-white p-0.5 rounded text-[10px]"
                            title="Send Backward"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateUI(prev => ({
                                ...prev,
                                menus: prev.menus.map(m => m.id === selectedMenuId ? {
                                  ...m,
                                  widgets: m.widgets.filter(w => w.id !== widget.id)
                                } : m)
                              }));
                              if (selectedWidgetId === widget.id) setSelectedWidgetId(null);
                            }}
                            className="text-red-400 hover:text-red-300 p-0.5 rounded ml-1"
                            title="Delete Element"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* CENTER: VISUAL DRAG & DROP CANVAS */}
          <div className="flex-1 bg-neutral-950 flex flex-col overflow-hidden relative">
            {/* Canvas Header Banner (Screen info & Simulation state) */}
            <div className="h-9 bg-neutral-900/60 border-b border-neutral-800 px-4 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-bold text-neutral-300 flex items-center gap-1.5">
                  <span>Displaying:</span>
                  <span className="text-emerald-400">{displayedMenu.name}</span>
                </span>
                {isTestMode && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 ${
                    isGamePaused 
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/50' 
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                  }`}>
                    {isGamePaused ? <Pause size={10} /> : <Play size={10} />}
                    <span>{isGamePaused ? 'ENGINE PAUSED' : 'ENGINE RUNNING'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {!isTestMode && (
                  <span className="text-[11px] text-neutral-500 hidden sm:inline">
                    💡 Click element to select • Drag to move • Drag bottom-right corner to resize
                  </span>
                )}
                {isTestMode && testNavigationHistory.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...testNavigationHistory];
                      updated.pop();
                      const prevId = updated[updated.length - 1];
                      setTestNavigationHistory(updated);
                      setTestActiveMenuId(prevId);
                    }}
                    className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-[11px] font-bold flex items-center gap-1"
                  >
                    <span>⬅️ Back ({testNavigationHistory.length - 1})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative">
              <div
                ref={canvasRef}
                style={{
                  width: canvasResolution === '16:9' ? '880px' : canvasResolution === '4:3' ? '740px' : '420px',
                  height: canvasResolution === '16:9' ? '495px' : canvasResolution === '4:3' ? '555px' : '680px',
                  backgroundImage: canvasBackdrop === 'game_scene' 
                    ? 'radial-gradient(ellipse at center, #1e1b4b 0%, #09090b 100%)' 
                    : canvasBackdrop === 'grid_cyber'
                    ? 'radial-gradient(#38bdf822 1px, transparent 1px)'
                    : 'none',
                  backgroundColor: canvasBackdrop === 'dark_void' ? '#09090b' : '#030712',
                  backgroundSize: canvasBackdrop === 'grid_cyber' ? '16px 16px' : 'cover'
                }}
                className={`relative rounded-2xl border border-neutral-800 shadow-2xl overflow-hidden transition-all duration-150 ${computedFontClass}`}
                onClick={() => {
                  if (!isTestMode) setSelectedWidgetId(null);
                }}
              >
                {/* Backdrop decoration (Metroidvania atmospheric art in game scene mode) */}
                {canvasBackdrop === 'game_scene' && (
                  <div className="absolute inset-0 pointer-events-none opacity-35 overflow-hidden">
                    <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80"></div>
                  </div>
                )}

                {/* Grid Overlay Lines (when designing) */}
                {!isTestMode && showGridLines && snapGridSize > 0 && (
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
                      backgroundSize: `${snapGridSize * 2}px ${snapGridSize * 2}px`
                    }}
                  />
                )}

                {/* Backdrop Blur if screen is marked as overlay */}
                {displayedMenu.isOverlay && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backdropFilter: `blur(${displayedMenu.backdropBlur || 12}px)`,
                      backgroundColor: displayedMenu.backgroundColor || 'rgba(0, 0, 0, 0.65)'
                    }}
                  />
                )}

                {/* Render Widgets */}
                {displayedMenu.widgets.map((widget) => {
                  const isSelected = !isTestMode && widget.id === selectedWidgetId;
                  const isHovered = !isTestMode && widget.id === hoveredWidgetId;

                  return (
                    <div
                      key={widget.id}
                      style={{
                        position: 'absolute',
                        left: `${widget.x}px`,
                        top: `${widget.y}px`,
                        width: `${widget.width}px`,
                        height: `${widget.height}px`,
                        zIndex: isSelected ? 40 : 10
                      }}
                      onPointerDown={(e) => {
                        if (isTestMode) return;
                        e.stopPropagation();
                        setSelectedWidgetId(widget.id);
                        setIsDraggingWidget(true);
                        setDragStartPos({
                          mouseX: e.clientX,
                          mouseY: e.clientY,
                          widgetX: widget.x,
                          widgetY: widget.y
                        });
                      }}
                      onMouseEnter={() => !isTestMode && setHoveredWidgetId(widget.id)}
                      onMouseLeave={() => !isTestMode && setHoveredWidgetId(null)}
                      className={`group transition-transform select-none ${
                        !isTestMode ? 'cursor-move' : ''
                      } ${
                        isSelected 
                          ? 'ring-2 ring-emerald-500 shadow-2xl ring-offset-2 ring-offset-neutral-950' 
                          : isHovered 
                          ? 'ring-1 ring-emerald-500/50' 
                          : ''
                      }`}
                    >
                      {/* Selection Coordinate Badge */}
                      {isSelected && (
                        <div className="absolute -top-6 left-0 bg-emerald-600 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow flex items-center gap-1.5 pointer-events-none">
                          <span>{widget.name}</span>
                          <span>({widget.x}, {widget.y})</span>
                          <span>{widget.width}x{widget.height}</span>
                        </div>
                      )}

                      {/* Resize Handle (Bottom-Right) */}
                      {isSelected && !isTestMode && (
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setIsResizingWidget(true);
                            setResizeStartPos({
                              mouseX: e.clientX,
                              mouseY: e.clientY,
                              startW: widget.width,
                              startH: widget.height
                            });
                          }}
                          className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow cursor-se-resize flex items-center justify-center z-50 hover:scale-125 transition"
                          title="Drag to resize width and height"
                        />
                      )}

                      {/* --- WIDGET TYPE 1: BUTTON --- */}
                      {widget.type === 'button' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            if (isTestMode) {
                              e.stopPropagation();
                              handleTestButtonClick(widget);
                            }
                          }}
                          style={{
                            backgroundColor: widget.backgroundColor || (widget.isPrimary ? colors.primaryAccent : colors.cardBg),
                            color: widget.color || '#ffffff',
                            borderColor: widget.borderColor || (widget.isPrimary ? colors.primaryAccent : colors.cardBorder),
                            borderRadius: `${widget.borderRadius ?? computedRadiusPx}px`
                          }}
                          className={`w-full h-full border font-bold text-xs flex items-center justify-center gap-2 px-3 shadow-lg transition duration-150 ${
                            isTestMode ? 'hover:scale-105 active:scale-95 cursor-pointer' : ''
                          }`}
                        >
                          {widget.icon && <span className="text-base shrink-0">{widget.icon}</span>}
                          <span className="truncate">{widget.text || 'Action Button'}</span>
                          {widget.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-950 border border-amber-500/50 text-amber-300 font-mono">
                              {widget.badge}
                            </span>
                          )}
                          {widget.pauseAction && widget.pauseAction !== 'none' && (
                            <span className="text-[9px] px-1 rounded bg-neutral-900/80 text-neutral-400 font-mono" title={`Pause action: ${widget.pauseAction}`}>
                              {widget.pauseAction === 'pause' ? '⏸️' : '▶️'}
                            </span>
                          )}
                        </button>
                      )}

                      {/* --- WIDGET TYPE 2: TEXT BOX --- */}
                      {widget.type === 'text' && (
                        <div
                          style={{
                            color: widget.color || colors.primaryAccent,
                            fontSize: `${widget.fontSize || 18}px`,
                            textAlign: widget.textAlign || 'left'
                          }}
                          className="w-full h-full font-bold flex items-center overflow-hidden leading-tight"
                        >
                          <span className="w-full truncate">{widget.text || 'Header Text'}</span>
                        </div>
                      )}

                      {/* --- WIDGET TYPE 3: INPUT FIELD --- */}
                      {widget.type === 'input_field' && (
                        <div
                          style={{
                            backgroundColor: widget.backgroundColor || colors.cardBg,
                            borderColor: widget.borderColor || colors.cardBorder,
                            borderRadius: `${widget.borderRadius ?? computedRadiusPx}px`
                          }}
                          className="w-full h-full border flex items-center px-3 gap-2 shadow-inner"
                        >
                          <span className="text-neutral-500 text-xs">✍️</span>
                          <input
                            type={widget.inputType || 'text'}
                            disabled={!isTestMode}
                            value={isTestMode ? (testInputValues[widget.id] ?? widget.text ?? '') : (widget.text ?? '')}
                            onChange={(e) => {
                              if (isTestMode) {
                                setTestInputValues(prev => ({ ...prev, [widget.id]: e.target.value }));
                              }
                            }}
                            placeholder={widget.placeholder || 'Enter text...'}
                            style={{ color: widget.color || '#ffffff' }}
                            className="bg-transparent text-xs font-semibold focus:outline-none w-full disabled:cursor-move"
                          />
                        </div>
                      )}

                      {/* --- WIDGET TYPE 4: PROGRESS BAR --- */}
                      {widget.type === 'progress_bar' && (
                        <div
                          style={{
                            backgroundColor: widget.backgroundColor || '#27272a',
                            borderRadius: `${widget.borderRadius ?? computedRadiusPx}px`
                          }}
                          className="w-full h-full border border-neutral-700/80 overflow-hidden relative flex items-center shadow-inner"
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, ((widget.value ?? 75) / (widget.maxValue ?? 100)) * 100))}%`,
                              backgroundColor: widget.color || colors.healthColor
                            }}
                            className="h-full transition-all duration-300"
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow font-mono">
                            {widget.text || `${widget.value ?? 75}/${widget.maxValue ?? 100}`}
                          </span>
                        </div>
                      )}

                      {/* --- WIDGET TYPE 5: SLIDER --- */}
                      {widget.type === 'slider' && (
                        <div
                          style={{
                            backgroundColor: widget.backgroundColor || colors.cardBg,
                            borderColor: widget.borderColor || colors.cardBorder,
                            borderRadius: `${widget.borderRadius ?? computedRadiusPx}px`
                          }}
                          className="w-full h-full border p-2 flex flex-col justify-center gap-1 shadow"
                        >
                          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300">
                            <span className="truncate">{widget.text || 'Slider Option'}</span>
                            <span className="font-mono text-emerald-400">
                              {isTestMode ? (testSliderValues[widget.id] ?? widget.value ?? 50) : (widget.value ?? 50)}{widget.unit || ''}
                            </span>
                          </div>
                          <input
                            type="range"
                            disabled={!isTestMode}
                            min={widget.minValue ?? 0}
                            max={widget.maxValue ?? 100}
                            step={widget.step ?? 1}
                            value={isTestMode ? (testSliderValues[widget.id] ?? widget.value ?? 50) : (widget.value ?? 50)}
                            onChange={(e) => {
                              if (isTestMode) {
                                setTestSliderValues(prev => ({ ...prev, [widget.id]: Number(e.target.value) }));
                              }
                            }}
                            className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:cursor-move"
                          />
                        </div>
                      )}

                      {/* --- WIDGET TYPE 6: TOGGLE / SWITCH --- */}
                      {widget.type === 'toggle' && (
                        <div
                          style={{
                            backgroundColor: widget.backgroundColor || colors.cardBg,
                            borderColor: widget.borderColor || colors.cardBorder,
                            borderRadius: `${widget.borderRadius ?? computedRadiusPx}px`
                          }}
                          className="w-full h-full border px-3 flex items-center justify-between shadow"
                        >
                          <span className="text-xs font-semibold text-neutral-200 truncate">{widget.text || 'Toggle Option'}</span>
                          <button
                            type="button"
                            disabled={!isTestMode}
                            onClick={() => {
                              if (isTestMode) {
                                setTestToggleValues(prev => ({ ...prev, [widget.id]: !prev[widget.id] }));
                              }
                            }}
                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                              (isTestMode ? (testToggleValues[widget.id] ?? widget.checked ?? false) : (widget.checked ?? false))
                                ? 'bg-emerald-600'
                                : 'bg-neutral-700'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                (isTestMode ? (testToggleValues[widget.id] ?? widget.checked ?? false) : (widget.checked ?? false))
                                  ? 'translate-x-4'
                                  : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      )}

                      {/* --- WIDGET TYPE 7: CARD PANEL --- */}
                      {widget.type === 'card' && (
                        <div
                          style={{
                            backgroundColor: widget.backgroundColor || '#18181be6',
                            borderColor: widget.borderColor || colors.cardBorder,
                            borderRadius: `${widget.borderRadius ?? computedRadiusPx}px`
                          }}
                          className="w-full h-full border p-3.5 shadow-xl whitespace-pre-line text-xs text-neutral-300 overflow-hidden leading-relaxed"
                        >
                          {widget.text || 'Card Content'}
                        </div>
                      )}

                      {/* --- WIDGET TYPE 8: IMAGE / ICON --- */}
                      {widget.type === 'image' && (
                        <div
                          style={{
                            backgroundColor: widget.backgroundColor || colors.cardBg,
                            borderColor: widget.borderColor || colors.primaryAccent,
                            borderRadius: `${widget.borderRadius ?? computedRadiusPx}px`
                          }}
                          className="w-full h-full border flex items-center justify-center text-3xl shadow-lg"
                        >
                          {widget.icon || '⚔️'}
                        </div>
                      )}

                      {/* --- WIDGET TYPE 9: BADGE / CHIP --- */}
                      {widget.type === 'badge' && (
                        <div
                          style={{
                            backgroundColor: widget.backgroundColor || '#3b0764',
                            borderColor: widget.borderColor || '#a855f7',
                            color: widget.color || '#e9d5ff',
                            borderRadius: `${widget.borderRadius ?? 9999}px`
                          }}
                          className="w-full h-full border flex items-center justify-center gap-1.5 px-2 font-mono text-xs font-bold shadow"
                        >
                          {widget.icon && <span>{widget.icon}</span>}
                          <span className="truncate">{widget.text || 'BADGE'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: ELEMENT INSPECTOR & LINKING SETTINGS */}
          <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0 overflow-y-auto">
            {selectedWidget ? (
              <div className="p-4 space-y-4">
                {/* Header info */}
                <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {selectedWidget.type === 'button' ? '🔘' : selectedWidget.type === 'input_field' ? '💬' : selectedWidget.type === 'text' ? '📝' : selectedWidget.type === 'slider' ? '🎚️' : selectedWidget.type === 'progress_bar' ? '📊' : selectedWidget.type === 'toggle' ? '🔘' : '🗃️'}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white uppercase">{selectedWidget.type.replace('_', ' ')} INSPECTOR</div>
                      <div className="text-[10px] text-neutral-500 font-mono">{selectedWidget.id}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedWidgetId(null)}
                    className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Element Label / Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Element Name</label>
                  <input
                    type="text"
                    value={selectedWidget.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateUI(prev => ({
                        ...prev,
                        menus: prev.menus.map(m => m.id === selectedMenuId ? {
                          ...m,
                          widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, name: val } : w)
                        } : m)
                      }));
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* --- BUTTON SPECIFIC: ACTIONS & MENU LINKING --- */}
                {selectedWidget.type === 'button' && (
                  <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
                    <div className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                      <Zap size={13} />
                      <span>Button Action & Menu Linking</span>
                    </div>

                    {/* Action Selector */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-neutral-300">Primary Action</label>
                      <select
                        value={selectedWidget.action || 'navigate_menu'}
                        onChange={(e) => {
                          const val = e.target.value as UIButtonActionType;
                          updateUI(prev => ({
                            ...prev,
                            menus: prev.menus.map(m => m.id === selectedMenuId ? {
                              ...m,
                              widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, action: val } : w)
                            } : m)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="navigate_menu">🧭 Navigate To Menu / Screen</option>
                        <option value="close_menu">✖️ Close Menu / Go Back</option>
                        <option value="start_game">⚔️ Start Game (Launch World)</option>
                        <option value="resume_game">▶️ Resume Game (Unpause)</option>
                        <option value="quit_game">🚪 Quit Game / Title Screen</option>
                        <option value="custom_event">⚡ Trigger Custom Script Event</option>
                      </select>
                    </div>

                    {/* Target Menu Selector (When Navigate To Menu is picked) */}
                    {selectedWidget.action === 'navigate_menu' && (
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-neutral-300">Target Menu to Open</label>
                        <select
                          value={selectedWidget.targetMenuId || ui.menus[0]?.id}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateUI(prev => ({
                              ...prev,
                              menus: prev.menus.map(m => m.id === selectedMenuId ? {
                                ...m,
                                widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, targetMenuId: val } : w)
                              } : m)
                            }));
                          }}
                          className="w-full bg-neutral-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-xs text-emerald-200 focus:outline-none"
                        >
                          {ui.menus.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.widgets.length} elements)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pause Checkbox / Behavior (User Explicit Request) */}
                    <div className="pt-2 border-t border-neutral-800 space-y-1.5">
                      <label className="text-[11px] font-semibold text-neutral-300">Game Pause Behavior</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            updateUI(prev => ({
                              ...prev,
                              menus: prev.menus.map(m => m.id === selectedMenuId ? {
                                ...m,
                                widgets: m.widgets.map(w => w.id === selectedWidget.id ? { 
                                  ...w, 
                                  pauseAction: w.pauseAction === 'pause' ? 'none' : 'pause' 
                                } : w)
                              } : m)
                            }));
                          }}
                          className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            selectedWidget.pauseAction === 'pause'
                              ? 'bg-amber-950 border-amber-500 text-amber-200'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Pause size={12} />
                          <span>Pause Game</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            updateUI(prev => ({
                              ...prev,
                              menus: prev.menus.map(m => m.id === selectedMenuId ? {
                                ...m,
                                widgets: m.widgets.map(w => w.id === selectedWidget.id ? { 
                                  ...w, 
                                  pauseAction: w.pauseAction === 'unpause' ? 'none' : 'unpause' 
                                } : w)
                              } : m)
                            }));
                          }}
                          className={`p-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                            selectedWidget.pauseAction === 'unpause'
                              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <Play size={12} />
                          <span>Unpause</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Text / Placeholder / Multiline */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">
                    {selectedWidget.type === 'text' ? 'Display Text' : selectedWidget.type === 'input_field' ? 'Default Value' : 'Button / Card Label'}
                  </label>
                  {selectedWidget.type === 'card' ? (
                    <textarea
                      rows={4}
                      value={selectedWidget.text || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === selectedMenuId ? {
                            ...m,
                            widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, text: val } : w)
                          } : m)
                        }));
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={selectedWidget.text || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === selectedMenuId ? {
                            ...m,
                            widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, text: val } : w)
                          } : m)
                        }));
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Input Field Placeholder (if input field) */}
                {selectedWidget.type === 'input_field' && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Placeholder Text</label>
                    <input
                      type="text"
                      value={selectedWidget.placeholder || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === selectedMenuId ? {
                            ...m,
                            widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, placeholder: val } : w)
                          } : m)
                        }));
                      }}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Icon Emoji / Symbol */}
                {(selectedWidget.type === 'button' || selectedWidget.type === 'image' || selectedWidget.type === 'badge') && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-neutral-300">Icon Emoji / Symbol</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={selectedWidget.icon || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateUI(prev => ({
                            ...prev,
                            menus: prev.menus.map(m => m.id === selectedMenuId ? {
                              ...m,
                              widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, icon: val } : w)
                            } : m)
                          }));
                        }}
                        className="w-20 bg-neutral-950 border border-neutral-800 rounded-lg px-2 py-1 text-center text-sm focus:outline-none"
                      />
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {['⚔️', '🛡️', '▶️', '⚙️', '🎒', '💾', '🗝️', '🧪', '💎', '🚪', '⚡'].map(ic => (
                          <button
                            key={ic}
                            type="button"
                            onClick={() => {
                              updateUI(prev => ({
                                ...prev,
                                menus: prev.menus.map(m => m.id === selectedMenuId ? {
                                  ...m,
                                  widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, icon: ic } : w)
                                } : m)
                              }));
                            }}
                            className="p-1 rounded hover:bg-neutral-800 text-xs"
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Layout Coordinates: X, Y, Width, Height */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <div className="text-xs font-bold text-neutral-400 uppercase flex items-center justify-between">
                    <span>Position & Dimensions</span>
                    <Move size={12} />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-neutral-500 font-mono">X (px)</label>
                      <input
                        type="number"
                        value={selectedWidget.x}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateUI(prev => ({
                            ...prev,
                            menus: prev.menus.map(m => m.id === selectedMenuId ? {
                              ...m,
                              widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, x: val } : w)
                            } : m)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-mono">Y (px)</label>
                      <input
                        type="number"
                        value={selectedWidget.y}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateUI(prev => ({
                            ...prev,
                            menus: prev.menus.map(m => m.id === selectedMenuId ? {
                              ...m,
                              widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, y: val } : w)
                            } : m)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-mono">Width (px)</label>
                      <input
                        type="number"
                        value={selectedWidget.width}
                        onChange={(e) => {
                          const val = Math.max(20, Number(e.target.value));
                          updateUI(prev => ({
                            ...prev,
                            menus: prev.menus.map(m => m.id === selectedMenuId ? {
                              ...m,
                              widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, width: val } : w)
                            } : m)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 font-mono">Height (px)</label>
                      <input
                        type="number"
                        value={selectedWidget.height}
                        onChange={(e) => {
                          const val = Math.max(16, Number(e.target.value));
                          updateUI(prev => ({
                            ...prev,
                            menus: prev.menus.map(m => m.id === selectedMenuId ? {
                              ...m,
                              widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, height: val } : w)
                            } : m)
                          }));
                        }}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs font-mono text-white"
                      />
                    </div>
                  </div>

                  {/* Alignment Actions */}
                  <div className="pt-2 flex items-center justify-between gap-1 border-t border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        const targetW = canvasResolution === '16:9' ? 880 : canvasResolution === '4:3' ? 740 : 420;
                        const centerX = Math.max(0, Math.round((targetW - selectedWidget.width) / 2));
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === selectedMenuId ? {
                            ...m,
                            widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, x: centerX } : w)
                          } : m)
                        }));
                      }}
                      className="flex-1 py-1 bg-neutral-900 hover:bg-neutral-800 rounded text-[10px] font-bold text-neutral-300"
                    >
                      Center X
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetH = canvasResolution === '16:9' ? 495 : canvasResolution === '4:3' ? 555 : 680;
                        const centerY = Math.max(0, Math.round((targetH - selectedWidget.height) / 2));
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === selectedMenuId ? {
                            ...m,
                            widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, y: centerY } : w)
                          } : m)
                        }));
                      }}
                      className="flex-1 py-1 bg-neutral-900 hover:bg-neutral-800 rounded text-[10px] font-bold text-neutral-300"
                    >
                      Center Y
                    </button>
                  </div>
                </div>

                {/* Color & Styling Overrides */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-neutral-300">Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedWidget.backgroundColor || colors.primaryAccent}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === selectedMenuId ? {
                            ...m,
                            widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, backgroundColor: val } : w)
                          } : m)
                        }));
                      }}
                      className="w-8 h-8 rounded border border-neutral-700 bg-neutral-950 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedWidget.backgroundColor || colors.primaryAccent}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === selectedMenuId ? {
                            ...m,
                            widgets: m.widgets.map(w => w.id === selectedWidget.id ? { ...w, backgroundColor: val } : w)
                          } : m)
                        }));
                      }}
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs font-mono text-white"
                    />
                  </div>
                </div>

                {/* Delete Element Action */}
                <div className="pt-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => {
                      updateUI(prev => ({
                        ...prev,
                        menus: prev.menus.map(m => m.id === selectedMenuId ? {
                          ...m,
                          widgets: m.widgets.filter(w => w.id !== selectedWidget.id)
                        } : m)
                      }));
                      setSelectedWidgetId(null);
                    }}
                    className="w-full py-2 bg-red-950/80 hover:bg-red-900 border border-red-800/80 text-red-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Delete Element</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SCREEN / MENU PROPERTIES (When no widget selected) */
              <div className="p-4 space-y-4">
                <div className="border-b border-neutral-800 pb-2">
                  <div className="text-xs font-bold text-white uppercase">MENU SCREEN SETTINGS</div>
                  <div className="text-[10px] text-neutral-500 font-mono">{currentMenu.id}</div>
                </div>

                {/* Menu Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Screen Name</label>
                  <input
                    type="text"
                    value={currentMenu.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateUI(prev => ({
                        ...prev,
                        menus: prev.menus.map(m => m.id === currentMenu.id ? { ...m, name: val } : m)
                      }));
                    }}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300">Description / Note</label>
                  <input
                    type="text"
                    value={currentMenu.description || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateUI(prev => ({
                        ...prev,
                        menus: prev.menus.map(m => m.id === currentMenu.id ? { ...m, description: val } : m)
                      }));
                    }}
                    placeholder="e.g. Pause Menu with inventory"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Initial Screen Checkbox */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentMenu.isInitialScreen || (ui.initialMenuId && ui.initialMenuId === currentMenu.id))}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateUI(prev => ({
                          ...prev,
                          initialMenuId: checked ? currentMenu.id : undefined,
                          menus: prev.menus.map(m => ({
                            ...m,
                            isInitialScreen: checked ? m.id === currentMenu.id : false
                          }))
                        }));
                        triggerActionFeedback(
                          checked 
                            ? `"${currentMenu.name}" set as Start / Landing Screen` 
                            : `Cleared Start Screen for "${currentMenu.name}"`
                        );
                      }}
                      className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-neutral-200">Start / Initial Landing Screen</span>
                  </label>
                  <p className="text-[10px] text-neutral-500">
                    The game engine will boot into this screen by default when launching (only one screen can be designated).
                  </p>
                </div>

                {/* In-Game Pause Menu Checkbox */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentMenu.isPauseMenu || (ui.pauseMenuId && ui.pauseMenuId === currentMenu.id))}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateUI(prev => ({
                          ...prev,
                          pauseMenuId: checked ? currentMenu.id : undefined,
                          menus: prev.menus.map(m => ({
                            ...m,
                            isPauseMenu: checked ? m.id === currentMenu.id : false
                          }))
                        }));
                        triggerActionFeedback(
                          checked 
                            ? `"${currentMenu.name}" set as default In-Game Pause Menu` 
                            : `Cleared In-Game Pause Menu for "${currentMenu.name}"`
                        );
                      }}
                      className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-amber-500 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-neutral-200">In-Game Pause Menu</span>
                  </label>
                  <p className="text-[10px] text-neutral-500">
                    Triggered when pressing the Pause key/button during gameplay (only one screen can be designated).
                  </p>
                </div>

                {/* Overlay Screen Mode (for Pause/Inventory Overlays) */}
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentMenu.isOverlay || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        updateUI(prev => ({
                          ...prev,
                          menus: prev.menus.map(m => m.id === currentMenu.id ? { ...m, isOverlay: checked } : m)
                        }));
                      }}
                      className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-neutral-200">Render as Overlay Window</span>
                  </label>
                  <p className="text-[10px] text-neutral-500">
                    Renders a dark backdrop blur behind elements (perfect for Pause Menus & Dialogue Boxes).
                  </p>
                </div>

                {/* Quick actions */}
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleDuplicateMenu(currentMenu)}
                    className="w-full py-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Copy size={13} />
                    <span>Duplicate This Menu</span>
                  </button>

                  {ui.menus.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMenu(currentMenu.id)}
                      className="w-full py-2 bg-red-950/60 hover:bg-red-900 border border-red-900 text-red-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Delete Screen</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 5. TAB 2: INPUT & KEY MAPPINGS */
        <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
          {/* Input Header & Filters */}
          <div className="p-4 border-b border-neutral-800 bg-neutral-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="text-emerald-400" size={18} />
                <span className="text-sm font-bold text-white">Input & Gamepad Action Bindings</span>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                ({(ui.inputMappings || UNIFIED_INPUT_TEMPLATE).length} Actions Mapped)
              </span>
            </div>

            {/* Category Filter Pills & Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search actions, keys, categories..."
                  value={inputSearchQuery}
                  onChange={(e) => setInputSearchQuery(e.target.value)}
                  className="bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 w-44 sm:w-56"
                />
              </div>

              <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                {(['all', 'movement', 'combat', 'interaction', 'navigation'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveInputCategory(cat)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold capitalize transition ${
                      activeInputCategory === cat
                        ? 'bg-emerald-600 text-white'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const currentMappings = ui.inputMappings || [...UNIFIED_INPUT_TEMPLATE];
                  const newBinding: InputMapping = {
                    id: `inp_${Date.now()}`,
                    name: `custom_action_${currentMappings.length + 1}`,
                    label: 'New Action Binding',
                    category: 'custom',
                    triggerMode: 'press',
                    actionType: 'gameplay_action',
                    keys: ['KeyF'],
                    gamepadButtons: ['ButtonSouth / A']
                  };
                  updateUI(u => ({ ...u, inputMappings: [...currentMappings, newBinding] }));
                  triggerActionFeedback('Added new input binding');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-950"
              >
                <Plus size={13} />
                <span>Add Binding</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  updateUI(u => ({ ...u, inputMappings: [...UNIFIED_INPUT_TEMPLATE] }));
                  triggerActionFeedback("Reset input mappings to Metroidvania defaults");
                }}
                className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                title="Reset to default controller & keyboard layout"
              >
                <RotateCcw size={12} />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Mappings Table */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-5xl mx-auto space-y-3">
              {(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)
                .map((inp, idx) => ({ inp, idx }))
                .filter(({ inp }) => {
                  if (activeInputCategory !== 'all' && (inp.category || '').toLowerCase() !== activeInputCategory.toLowerCase()) return false;
                  if (inputSearchQuery) {
                    const q = inputSearchQuery.toLowerCase();
                    return (
                      (inp.name || '').toLowerCase().includes(q) || 
                      (inp.label || '').toLowerCase().includes(q) || 
                      (inp.category || '').toLowerCase().includes(q) ||
                      (inp.keys || []).some(k => k.toLowerCase().includes(q))
                    );
                  }
                  return true;
                })
                .map(({ inp, idx }) => {
                  const isUiTrigger = inp.actionType === 'open_ui';

                  return (
                    <div
                      key={inp.id || idx}
                      className="p-3.5 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-3 hover:border-neutral-700 transition"
                    >
                      {/* Top Row: Label, Event Name, Category, Trigger Mode, UI Target */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                        {/* Display Label */}
                        <div className="md:col-span-3">
                          <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">Label / Display</label>
                          <input
                            type="text"
                            value={inp.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                              mappings[idx] = { ...mappings[idx], label: val };
                              updateUI(u => ({ ...u, inputMappings: mappings }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2.5 py-1 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                            placeholder="e.g. Jump / Ascent"
                          />
                        </div>

                        {/* Event / Action Identifier */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">Event Name</label>
                          <input
                            type="text"
                            value={inp.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                              mappings[idx] = { ...mappings[idx], name: val };
                              updateUI(u => ({ ...u, inputMappings: mappings }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
                            placeholder="e.g. jump, pause_menu"
                          />
                        </div>

                        {/* Category (Text Box) */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">Category</label>
                          <input
                            type="text"
                            value={inp.category || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                              mappings[idx] = { ...mappings[idx], category: val };
                              updateUI(u => ({ ...u, inputMappings: mappings }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-emerald-500"
                            placeholder="movement, combat, ui..."
                          />
                        </div>

                        {/* Interaction / Trigger Mode */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">Interaction Type</label>
                          <select
                            value={inp.triggerMode || 'press'}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                              mappings[idx] = { ...mappings[idx], triggerMode: val };
                              updateUI(u => ({ ...u, inputMappings: mappings }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                          >
                            <option value="press">Press (On Down)</option>
                            <option value="hold">Hold (Continuous)</option>
                            <option value="toggle">Toggle (Switch)</option>
                            <option value="tap">Tap (Quick Tap)</option>
                            <option value="release">Release (On Up)</option>
                            <option value="double_tap">Double Tap</option>
                            <option value="combo">Combo Key</option>
                          </select>
                        </div>

                        {/* Action Target / UI Trigger */}
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-neutral-400 block mb-0.5">Action Target</label>
                          <select
                            value={inp.actionType || (inp.name === 'pause_menu' || inp.name === 'inventory' || inp.name === 'map_tracker' ? 'open_ui' : 'gameplay_action')}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                              mappings[idx] = { 
                                ...mappings[idx], 
                                actionType: val,
                                targetUiMenuId: val === 'open_ui' ? (mappings[idx].targetUiMenuId || 'pause_menu') : undefined
                              };
                              updateUI(u => ({ ...u, inputMappings: mappings }));
                            }}
                            className="w-full bg-neutral-950 border border-neutral-750 rounded-lg px-2 py-1 text-xs text-amber-300 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="gameplay_action">⚔️ Gameplay Event</option>
                            <option value="open_ui">🖥️ Open UI / Menu</option>
                          </select>
                        </div>

                        {/* Delete Button */}
                        <div className="md:col-span-1 flex justify-end pt-3 md:pt-0">
                          <button
                            type="button"
                            onClick={() => {
                              const mappings = (ui.inputMappings || UNIFIED_INPUT_TEMPLATE).filter((_, i) => i !== idx);
                              updateUI(u => ({ ...u, inputMappings: mappings }));
                              triggerActionFeedback(`Deleted binding "${inp.label}"`);
                            }}
                            className="p-1.5 text-neutral-500 hover:text-red-400 rounded-lg hover:bg-neutral-800 transition"
                            title="Delete Binding"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Optional Target Menu Selector when actionType is 'open_ui' */}
                      {(inp.actionType === 'open_ui' || (!inp.actionType && (inp.name === 'pause_menu' || inp.name === 'inventory' || inp.name === 'map_tracker'))) && (
                        <div className="p-2 bg-neutral-950/90 rounded-lg border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                          <span className="text-neutral-400 flex items-center gap-1.5">
                            <Layers size={13} className="text-amber-400" />
                            <span>Target Menu Screen to Open / Toggle:</span>
                          </span>
                          <select
                            value={inp.targetUiMenuId || 'pause_menu'}
                            onChange={(e) => {
                              const val = e.target.value;
                              const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                              mappings[idx] = { ...mappings[idx], targetUiMenuId: val };
                              updateUI(u => ({ ...u, inputMappings: mappings }));
                            }}
                            className="bg-neutral-900 border border-neutral-700 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-400 font-medium"
                          >
                            <option value="pause_menu">⏸️ Default In-Game Pause Menu</option>
                            <option value="initial_menu">🏠 Start / Title Screen</option>
                            {ui.menus.map(m => (
                              <option key={m.id} value={m.id}>📜 Screen: {m.name}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Bottom Row: Hardware Keys & Gamepad Bindings */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800/60 pt-2.5">
                        {/* Keyboard Keys */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-neutral-400 mr-1 flex items-center gap-1">
                            <Keyboard size={12} className="text-emerald-400" /> Keyboard:
                          </span>
                          {(inp.keys || []).map((k, kIdx) => (
                            <span
                              key={kIdx}
                              className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-700 text-neutral-200 font-mono text-[11px] shadow-sm flex items-center gap-1"
                            >
                              <Key size={10} className="text-emerald-400" />
                              <span>{k}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                                  mappings[idx] = {
                                    ...mappings[idx],
                                    keys: mappings[idx].keys.filter((_, i) => i !== kIdx)
                                  };
                                  updateUI(u => ({ ...u, inputMappings: mappings }));
                                }}
                                className="text-neutral-500 hover:text-red-400 ml-0.5"
                                title="Remove key"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setRecordingTarget({
                                mappingIdx: idx,
                                targetType: 'keys',
                                actionLabel: inp.label
                              });
                              setRecordedValues([...inp.keys]);
                            }}
                            className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <span>+ Rebind Key</span>
                          </button>
                        </div>

                        {/* Gamepad Buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-neutral-400 mr-1 flex items-center gap-1">
                            <Gamepad2 size={12} className="text-cyan-400" /> Gamepad:
                          </span>
                          {(inp.gamepadButtons || []).map((btn, bIdx) => (
                            <span
                              key={bIdx}
                              className="px-2 py-0.5 rounded bg-neutral-950 border border-cyan-500/40 text-cyan-200 font-mono text-[11px] shadow-sm flex items-center gap-1"
                            >
                              <span>{btn}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                                  mappings[idx] = {
                                    ...mappings[idx],
                                    gamepadButtons: (mappings[idx].gamepadButtons || []).filter((_, i) => i !== bIdx)
                                  };
                                  updateUI(u => ({ ...u, inputMappings: mappings }));
                                }}
                                className="text-neutral-500 hover:text-red-400 ml-0.5"
                                title="Remove gamepad button"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setRecordingTarget({
                                mappingIdx: idx,
                                targetType: 'gamepadButtons',
                                actionLabel: inp.label
                              });
                              setRecordedValues([...(inp.gamepadButtons || [])]);
                            }}
                            className="px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition flex items-center gap-1"
                          >
                            <span>+ Rebind Gamepad</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* 6. REAL-TIME HARDWARE KEY & CONTROLLER CAPTURE MODAL */}
      {recordingTarget && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-950 border border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400">
                {recordingTarget.targetType === 'keys' ? <Keyboard size={24} /> : <Gamepad2 size={24} />}
              </div>
              <h3 className="text-base font-bold text-white">
                Rebinding "{recordingTarget.actionLabel}"
              </h3>
              <p className="text-xs text-neutral-400">
                {recordingTarget.targetType === 'keys'
                  ? 'Press any keyboard key or key combination now...'
                  : 'Press any button or trigger on your connected gamepad...'}
              </p>
            </div>

            {/* Live Captured Buttons */}
            <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 min-h-[72px] flex items-center justify-center flex-wrap gap-2">
              {recordedValues.length === 0 ? (
                <span className="text-xs text-neutral-500 animate-pulse font-mono">
                  [ Listening for input signal... ]
                </span>
              ) : (
                recordedValues.map((val, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-500 text-emerald-200 font-mono text-xs font-bold flex items-center gap-1.5"
                  >
                    <span>{val}</span>
                    <button
                      type="button"
                      onClick={() => setRecordedValues(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-neutral-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRecordingTarget(null);
                  setRecordedValues([]);
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRecordedValues([])}
                  className="px-3 py-2 bg-neutral-950 border border-neutral-800 hover:bg-neutral-800 text-neutral-400 rounded-xl text-xs font-bold transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mappings = [...(ui.inputMappings || UNIFIED_INPUT_TEMPLATE)];
                    if (mappings[recordingTarget.mappingIdx]) {
                      if (recordingTarget.targetType === 'keys') {
                        mappings[recordingTarget.mappingIdx].keys = recordedValues;
                      } else {
                        mappings[recordingTarget.mappingIdx].gamepadButtons = recordedValues;
                      }
                      updateUI(u => ({ ...u, inputMappings: mappings }));
                      triggerActionFeedback(`Rebound "${recordingTarget.actionLabel}"`);
                    }
                    setRecordingTarget(null);
                    setRecordedValues([]);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950"
                >
                  Save Binding
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. GLOBAL THEME & STYLES SLIDE-OVER DRAWER */}
      {isStyleDrawerOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 bg-neutral-900/98 border-l border-neutral-800 shadow-2xl backdrop-blur-xl p-4 overflow-y-auto flex flex-col space-y-4 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-purple-400" />
              <span className="text-sm font-bold text-white">Global Theme & Tokens</span>
            </div>
            <button
              type="button"
              onClick={() => setIsStyleDrawerOpen(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X size={16} />
            </button>
          </div>

          {/* Preset Theme Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-300">Style Presets</label>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { id: 'gothic_metroidvania', name: 'Gothic Obsidian & Ruby', icon: '🦇' },
                { id: 'cyberpunk_neon', name: 'Cybernetic Neon & Glass', icon: '⚡' },
                { id: 'pixel_16bit', name: '16-Bit Nostalgia & Retro', icon: '👾' },
                { id: 'minimal_dark', name: 'Sleek Midnight Glass', icon: '🌑' },
                { id: 'fantasy_arcane', name: 'Royal Arcane & Gold', icon: '✨' }
              ].map(preset => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    const template = DEFAULT_UI_THEMES.find(t => t.styling?.preset === preset.id) || DEFAULT_UI_THEMES[0];
                    updateUI(u => ({
                      ...u,
                      styling: template.styling ? { ...template.styling } : u.styling
                    }));
                  }}
                  className={`p-2 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                    styling.preset === preset.id
                      ? 'bg-purple-950 border-purple-500 text-purple-200 shadow'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{preset.icon}</span>
                    <span>{preset.name}</span>
                  </div>
                  {styling.preset === preset.id && <Check size={13} className="text-purple-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Roundness Preset & Custom Slider */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="text-xs font-bold text-neutral-300">Corner Roundness</label>
            <div className="grid grid-cols-5 gap-1 text-[11px] font-mono">
              {(['sharp', 'subtle', 'standard', 'smooth', 'pill'] as UICornerRoundness[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => updateUI(u => ({
                    ...u,
                    styling: { ...styling, roundness: r }
                  }))}
                  className={`py-1 rounded border text-center font-bold capitalize transition ${
                    styling.roundness === r
                      ? 'bg-emerald-600 border-emerald-400 text-white'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Custom Pixel Slider */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-neutral-400 font-mono">
                <span>Radius Value:</span>
                <span>{computedRadiusPx}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={32}
                value={styling.customRadiusPx ?? 8}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateUI(u => ({
                    ...u,
                    styling: { ...styling, roundness: 'custom', customRadiusPx: val }
                  }));
                }}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Color Palette Tokens */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="text-xs font-bold text-neutral-300">Theme Color Tokens</label>
            <div className="space-y-2">
              {[
                { label: 'Primary Accent', key: 'primaryAccent' as const },
                { label: 'Secondary Accent', key: 'secondaryAccent' as const },
                { label: 'Card Surface Background', key: 'cardBg' as const },
                { label: 'Health Vitality Fill', key: 'healthColor' as const },
                { label: 'Aether Mana Fill', key: 'manaColor' as const }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={colors[item.key] || '#d97706'}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateUI(u => ({
                          ...u,
                          styling: {
                            ...styling,
                            colors: { ...colors, [item.key]: val }
                          }
                        }));
                      }}
                      className="w-6 h-6 rounded border border-neutral-700 bg-transparent cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-neutral-400 w-16 text-right">
                      {colors[item.key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="text-xs font-bold text-neutral-300">Typography Font Family</label>
            <select
              value={styling.fontFamily || 'default'}
              onChange={(e) => {
                const val = e.target.value as any;
                updateUI(u => ({
                  ...u,
                  styling: { ...styling, fontFamily: val }
                }));
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none"
            >
              <option value="default">Default Sans UI</option>
              <option value="pixel">Pixel / Retro Monospace</option>
              <option value="serif_gothic">Serif Gothic Metroidvania</option>
              <option value="mono_scifi">Monospace Sci-Fi</option>
            </select>
          </div>
        </div>
      )}

      {/* Toast Notification Alert for UI Module */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200 pointer-events-none">
          <div 
            className={`px-4 py-2.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-red-950/95 border-red-500/60 text-red-200 shadow-red-950/50'
                : 'bg-neutral-900/95 border-neutral-700 text-neutral-200 shadow-neutral-950/50'
            }`}
          >
            {toast.type === 'success' && (
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            )}
            {toast.type === 'error' && <Flame size={16} className="text-red-400 shrink-0" />}
            {toast.type === 'info' && <Layout size={16} className="text-emerald-400 shrink-0" />}
            <span>{toast.text}</span>
          </div>
        </div>
      )}

    </div>
  );
};

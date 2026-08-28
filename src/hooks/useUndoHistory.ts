import { useState, useRef, useCallback, useEffect } from 'react';
import { RefinedMapData } from '../types';
import { RefinedBiome } from '../engine/refinedBiomeSchema';

export interface HistoryState {
  mapData: RefinedMapData;
  biomes: RefinedBiome[];
  activeBiomeId: string;
}

const MAX_HISTORY = 50;

/**
 * Deep clone utility for history snapshots to prevent mutation pollution
 */
const cloneState = (state: HistoryState): HistoryState => {
  return JSON.parse(JSON.stringify(state));
};

export const useUndoHistory = (initialState: HistoryState) => {
  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [redoStack, setRedoStack] = useState<HistoryState[]>([]);

  // Ref tracking current stroke starting state
  const strokeStartRef = useRef<HistoryState | null>(null);

  /**
   * Pushes a new state snapshot onto the undo stack and clears redo
   */
  const pushSnapshot = useCallback((state: HistoryState) => {
    setUndoStack(prev => {
      const cloned = cloneState(state);
      const updated = [...prev, cloned];
      if (updated.length > MAX_HISTORY) {
        return updated.slice(updated.length - MAX_HISTORY);
      }
      return updated;
    });
    setRedoStack([]);
  }, []);

  /**
   * Called when starting a continuous brush / eraser drawing action
   */
  const startStroke = useCallback((currentState: HistoryState) => {
    strokeStartRef.current = cloneState(currentState);
  }, []);

  /**
   * Called when finishing a brush / eraser stroke (mouse up / touch end)
   */
  const commitStroke = useCallback((currentState: HistoryState) => {
    if (strokeStartRef.current) {
      // Push the pre-stroke state onto undo stack
      const preStrokeState = strokeStartRef.current;
      strokeStartRef.current = null;

      setUndoStack(prev => {
        const updated = [...prev, preStrokeState];
        if (updated.length > MAX_HISTORY) {
          return updated.slice(updated.length - MAX_HISTORY);
        }
        return updated;
      });
      setRedoStack([]);
    }
  }, []);

  /**
   * Undoes the last action and returns the previous HistoryState or null
   */
  const undo = useCallback((currentState: HistoryState): HistoryState | null => {
    if (undoStack.length === 0) return null;

    const previousState = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, undoStack.length - 1);

    setUndoStack(newUndoStack);
    setRedoStack(prev => [cloneState(currentState), ...prev]);

    return cloneState(previousState);
  }, [undoStack]);

  /**
   * Redoes the last undone action and returns the next HistoryState or null
   */
  const redo = useCallback((currentState: HistoryState): HistoryState | null => {
    if (redoStack.length === 0) return null;

    const nextState = redoStack[0];
    const newRedoStack = redoStack.slice(1);

    setRedoStack(newRedoStack);
    setUndoStack(prev => [...prev, cloneState(currentState)]);

    return cloneState(nextState);
  }, [redoStack]);

  /**
   * Clears all history (e.g. on loading a fresh project)
   */
  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
    strokeStartRef.current = null;
  }, []);

  /**
   * Sets or restores history stacks (e.g. when loading project from storage or cloud)
   */
  const setHistoryStacks = useCallback((undoHistory: HistoryState[] = [], redoHistory: HistoryState[] = []) => {
    const clonedUndo = Array.isArray(undoHistory) ? JSON.parse(JSON.stringify(undoHistory)) : [];
    const clonedRedo = Array.isArray(redoHistory) ? JSON.parse(JSON.stringify(redoHistory)) : [];
    setUndoStack(clonedUndo);
    setRedoStack(clonedRedo);
    strokeStartRef.current = null;
  }, []);

  return {
    pushSnapshot,
    startStroke,
    commitStroke,
    undo,
    redo,
    clearHistory,
    setHistoryStacks,
    undoStack,
    redoStack,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length
  };
};

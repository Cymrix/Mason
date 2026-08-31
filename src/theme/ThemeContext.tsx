import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  AppThemeConfig, 
  AccentColorKey, 
  BackgroundToneKey, 
  ColorDef, 
  COLOR_DEFINITIONS, 
  BACKGROUND_TONES, 
  PRESET_APP_THEMES, 
  DEFAULT_CUSTOM_HEXES,
  getColorDef,
  getBackgroundToneDef,
  getThemeResolvedHexes,
  loadSavedAppTheme, 
  saveAppTheme,
  applyThemeCSSVariables
} from './appTheme';

interface ThemeContextType {
  theme: AppThemeConfig;
  primaryDef: ColorDef;
  bgDef: typeof BACKGROUND_TONES[BackgroundToneKey];
  getModuleColorDef: (moduleId: string) => ColorDef;
  setPresetTheme: (themeId: string) => void;
  setPrimaryColor: (colorKey: AccentColorKey, customHex?: string) => void;
  setModuleColor: (moduleId: keyof AppThemeConfig['moduleColors'], colorKey: AccentColorKey, customHex?: string) => void;
  setBackgroundTone: (toneKey: BackgroundToneKey, customHex?: string) => void;
  setCustomHexColor: (target: 'primary' | 'backgroundTone' | keyof AppThemeConfig['moduleColors'], hex: string) => void;
  updateTheme: (updater: (prev: AppThemeConfig) => AppThemeConfig) => void;
  resetTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppThemeConfig>(() => loadSavedAppTheme());

  useEffect(() => {
    applyThemeCSSVariables(theme);
  }, [theme]);

  const updateTheme = (updater: (prev: AppThemeConfig) => AppThemeConfig) => {
    setThemeState(prev => {
      const next = updater(prev);
      saveAppTheme(next);
      return next;
    });
  };

  const setPresetTheme = (themeId: string) => {
    const preset = PRESET_APP_THEMES.find(t => t.id === themeId);
    if (preset) {
      updateTheme(prev => ({
        ...preset,
        customHexes: prev.customHexes || DEFAULT_CUSTOM_HEXES
      }));
    }
  };

  const setPrimaryColor = (colorKey: AccentColorKey, customHex?: string) => {
    updateTheme(prev => {
      const nextHexes = { ...DEFAULT_CUSTOM_HEXES, ...(prev.customHexes || {}) };
      if (customHex) {
        nextHexes.primary = customHex;
      } else if (colorKey !== 'custom') {
        nextHexes.primary = COLOR_DEFINITIONS[colorKey]?.hex || '#ffffff';
      }
      return {
        ...prev,
        primary: colorKey,
        customHexes: nextHexes,
        isCustom: true,
        name: colorKey === 'custom' 
          ? `Custom (${nextHexes.primary.toUpperCase()})`
          : `Custom (${COLOR_DEFINITIONS[colorKey]?.name || colorKey})`
      };
    });
  };

  const setModuleColor = (moduleId: keyof AppThemeConfig['moduleColors'], colorKey: AccentColorKey, customHex?: string) => {
    updateTheme(prev => {
      const nextHexes = { ...DEFAULT_CUSTOM_HEXES, ...(prev.customHexes || {}) };
      if (customHex) {
        nextHexes[moduleId] = customHex;
      } else if (colorKey !== 'custom') {
        nextHexes[moduleId] = COLOR_DEFINITIONS[colorKey]?.hex || '#ffffff';
      }
      return {
        ...prev,
        moduleColors: {
          ...prev.moduleColors,
          [moduleId]: colorKey
        },
        customHexes: nextHexes,
        isCustom: true
      };
    });
  };

  const setBackgroundTone = (toneKey: BackgroundToneKey, customHex?: string) => {
    updateTheme(prev => {
      const nextHexes = { ...DEFAULT_CUSTOM_HEXES, ...(prev.customHexes || {}) };
      if (customHex) {
        nextHexes.backgroundTone = customHex;
      } else if (toneKey !== 'custom') {
        nextHexes.backgroundTone = BACKGROUND_TONES[toneKey]?.hex || '#0a0814';
      }
      return {
        ...prev,
        backgroundTone: toneKey,
        customHexes: nextHexes,
        isCustom: true
      };
    });
  };

  const setCustomHexColor = (target: 'primary' | 'backgroundTone' | keyof AppThemeConfig['moduleColors'], hex: string) => {
    updateTheme(prev => {
      const nextHexes = { ...DEFAULT_CUSTOM_HEXES, ...(prev.customHexes || {}) };
      nextHexes[target] = hex;

      if (target === 'primary') {
        return {
          ...prev,
          primary: 'custom',
          customHexes: nextHexes,
          isCustom: true,
          name: `Custom (${hex.toUpperCase()})`
        };
      } else if (target === 'backgroundTone') {
        return {
          ...prev,
          backgroundTone: 'custom',
          customHexes: nextHexes,
          isCustom: true
        };
      } else {
        return {
          ...prev,
          moduleColors: {
            ...prev.moduleColors,
            [target]: 'custom'
          },
          customHexes: nextHexes,
          isCustom: true
        };
      }
    });
  };

  const resetTheme = () => {
    const defaultTheme = PRESET_APP_THEMES[0];
    updateTheme(() => defaultTheme);
  };

  const primaryDef = useMemo(() => {
    return getColorDef(theme.primary, theme.customHexes?.primary || DEFAULT_CUSTOM_HEXES.primary);
  }, [theme.primary, theme.customHexes?.primary]);

  const bgDef = useMemo(() => {
    return getBackgroundToneDef(theme.backgroundTone, theme.customHexes?.backgroundTone || DEFAULT_CUSTOM_HEXES.backgroundTone);
  }, [theme.backgroundTone, theme.customHexes?.backgroundTone]);

  const getModuleColorDef = (moduleId: string): ColorDef => {
    const modKey = moduleId as keyof AppThemeConfig['moduleColors'];
    const accentKey = theme.moduleColors?.[modKey] || (moduleId === 'sprites' ? 'emerald' : 'cyan');
    return getColorDef(accentKey, theme.customHexes?.[modKey] || DEFAULT_CUSTOM_HEXES[modKey] || DEFAULT_CUSTOM_HEXES.sprites);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      primaryDef,
      bgDef,
      getModuleColorDef,
      setPresetTheme,
      setPrimaryColor,
      setModuleColor,
      setBackgroundTone,
      setCustomHexColor,
      updateTheme,
      resetTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};


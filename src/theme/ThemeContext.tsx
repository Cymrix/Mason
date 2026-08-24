import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { 
  AppThemeConfig, 
  AccentColorKey, 
  BackgroundToneKey, 
  ColorDef, 
  COLOR_DEFINITIONS, 
  BACKGROUND_TONES, 
  PRESET_APP_THEMES, 
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
  setPrimaryColor: (colorKey: AccentColorKey) => void;
  setModuleColor: (moduleId: keyof AppThemeConfig['moduleColors'], colorKey: AccentColorKey) => void;
  setBackgroundTone: (toneKey: BackgroundToneKey) => void;
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
      updateTheme(() => preset);
    }
  };

  const setPrimaryColor = (colorKey: AccentColorKey) => {
    updateTheme(prev => ({
      ...prev,
      primary: colorKey,
      isCustom: true,
      name: `Custom (${COLOR_DEFINITIONS[colorKey]?.name || colorKey})`
    }));
  };

  const setModuleColor = (moduleId: keyof AppThemeConfig['moduleColors'], colorKey: AccentColorKey) => {
    updateTheme(prev => ({
      ...prev,
      moduleColors: {
        ...prev.moduleColors,
        [moduleId]: colorKey
      },
      isCustom: true
    }));
  };

  const setBackgroundTone = (toneKey: BackgroundToneKey) => {
    updateTheme(prev => ({
      ...prev,
      backgroundTone: toneKey,
      isCustom: true
    }));
  };

  const resetTheme = () => {
    const defaultTheme = PRESET_APP_THEMES[0];
    updateTheme(() => defaultTheme);
  };

  const primaryDef = useMemo(() => {
    return COLOR_DEFINITIONS[theme.primary] || COLOR_DEFINITIONS.indigo;
  }, [theme.primary]);

  const bgDef = useMemo(() => {
    return BACKGROUND_TONES[theme.backgroundTone] || BACKGROUND_TONES.void;
  }, [theme.backgroundTone]);

  const getModuleColorDef = (moduleId: string): ColorDef => {
    const modKey = moduleId as keyof AppThemeConfig['moduleColors'];
    const accentKey = theme.moduleColors[modKey] || (moduleId === 'sprites' ? 'emerald' : 'cyan');
    return COLOR_DEFINITIONS[accentKey] || COLOR_DEFINITIONS.cyan;
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

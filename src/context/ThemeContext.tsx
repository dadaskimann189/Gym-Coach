import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AccentColor, AccentColorDefinition, ThemeMode } from '../types';

export const ACCENT_PALETTE: AccentColorDefinition[] = [
  {
    id: 'blue',
    label: 'iOS Blau',
    hex: '#0A84FF',
    lightHex: '#007AFF',
    contrastText: '#FFFFFF',
  },
  {
    id: 'green',
    label: 'Fitness Grün',
    hex: '#30D158',
    lightHex: '#34C759',
    contrastText: '#000000',
  },
  {
    id: 'purple',
    label: 'Lila / Violett',
    hex: '#BF5AF2',
    lightHex: '#AF52DE',
    contrastText: '#FFFFFF',
  },
  {
    id: 'cyan',
    label: 'Eisblau / Türkis',
    hex: '#64D2FF',
    lightHex: '#00C7BE',
    contrastText: '#000000',
  },
  {
    id: 'red',
    label: 'Karminrot',
    hex: '#FF453A',
    lightHex: '#FF3B30',
    contrastText: '#FFFFFF',
  },
  {
    id: 'yellow',
    label: 'Sonnengelb',
    hex: '#FFD60A',
    lightHex: '#FFCC00',
    contrastText: '#000000',
  },
  {
    id: 'orange',
    label: 'Warmes Orange',
    hex: '#FF9F0A',
    lightHex: '#FF9500',
    contrastText: '#000000',
  },
];

interface ThemeContextValue {
  themeMode: ThemeMode;
  accentColor: AccentColor;
  accent: AccentColorDefinition;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  palette: AccentColorDefinition[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  initialThemeMode?: ThemeMode;
  initialAccentColor?: AccentColor;
  onThemeChange?: (themeMode: ThemeMode, accentColor: AccentColor) => void;
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  initialThemeMode = 'dark',
  initialAccentColor = 'blue',
  onThemeChange,
  children,
}) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('pulse_theme_mode') as ThemeMode) || initialThemeMode;
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (localStorage.getItem('pulse_accent_color') as AccentColor) || initialAccentColor;
  });

  const accent = useMemo(() => {
    return ACCENT_PALETTE.find((c) => c.id === accentColor) || ACCENT_PALETTE[0];
  }, [accentColor]);

  // Sync with initial props when user loads from storage/server
  useEffect(() => {
    if (initialThemeMode && initialThemeMode !== themeMode) {
      setThemeModeState(initialThemeMode);
    }
  }, [initialThemeMode]);

  useEffect(() => {
    if (initialAccentColor && initialAccentColor !== accentColor) {
      setAccentColorState(initialAccentColor);
    }
  }, [initialAccentColor]);

  // Sync to CSS variables and document dataset
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeMode);
    if (themeMode === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    }

    const currentHex = themeMode === 'light' ? accent.lightHex : accent.hex;
    root.style.setProperty('--accent', currentHex);
    root.style.setProperty('--accent-contrast', accent.contrastText);
    root.style.setProperty(
      '--accent-muted',
      themeMode === 'light' ? `${currentHex}20` : `${currentHex}33`
    );

    localStorage.setItem('pulse_theme_mode', themeMode);
    localStorage.setItem('pulse_accent_color', accentColor);
  }, [themeMode, accent, accentColor]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('pulse_theme_mode', mode);
    onThemeChange?.(mode, accentColor);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem('pulse_accent_color', color);
    onThemeChange?.(themeMode, color);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        accentColor,
        accent,
        setThemeMode,
        setAccentColor,
        palette: ACCENT_PALETTE,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

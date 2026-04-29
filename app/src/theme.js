import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';

const LIGHT = {
  cream: '#FAF5EC',
  creamDeep: '#F2EADB',
  paper: '#FFFBF3',
  ink: '#2A1F18',
  ink70: 'rgba(42,31,24,0.70)',
  ink50: 'rgba(42,31,24,0.50)',
  ink30: 'rgba(42,31,24,0.28)',
  ink10: 'rgba(42,31,24,0.10)',
  ink06: 'rgba(42,31,24,0.06)',
  terracotta: '#C2562E',
  terracottaDeep: '#A8451F',
  terracottaSoft: '#EFD9CC',
  sage: '#7A8F6E',
  sageSoft: '#DDE5D4',
  butter: '#E9B85B',
  divider: 'rgba(42,31,24,0.08)',
  cream0: 'rgba(255,247,238,0)',
  onTerracotta: '#FFF7EE',
  onTerracotta85: 'rgba(255,247,238,0.85)',
  onTerracotta70: 'rgba(255,247,238,0.70)',
  onTerracotta60: 'rgba(255,247,238,0.60)',
  onTerracotta20: 'rgba(255,247,238,0.20)',
  onTerracotta18: 'rgba(255,247,238,0.18)',
  // Used for native-only things (StatusBar, modals)
  isDark: false,
};

const DARK = {
  cream:      '#15110C',          // page bg — warm near-black
  creamDeep:  '#221911',          // tags / ad bg — subtle lift
  paper:      '#2D2218',          // cards — clearly elevated above page
  ink:        '#F2E8D8',          // primary text
  ink70:      'rgba(242,232,216,0.74)',
  ink50:      'rgba(242,232,216,0.58)',
  ink30:      'rgba(242,232,216,0.34)',
  ink10:      'rgba(242,232,216,0.22)',  // borders / dividers — needs presence on dark
  ink06:      'rgba(242,232,216,0.14)',  // segmented track / subtle bgs
  terracotta: '#E27849',          // hero accent
  // "Deep" reads as the foreground over a Soft tinted surface — flip it
  // lighter in dark mode so text stays legible on terracottaSoft.
  terracottaDeep: '#F2A480',
  terracottaSoft: '#4F2E20',      // visible warm panel
  sage:       '#B0BFA1',          // lighter sage so notes read on paper
  sageSoft:   '#2E382A',
  butter:     '#E9B85B',
  divider:    'rgba(242,232,216,0.13)',
  cream0:     'rgba(255,247,238,0)',
  // The terracotta result-card stays terracotta in dark mode, so its
  // on-foreground colors are unchanged.
  onTerracotta:    '#FFF7EE',
  onTerracotta85:  'rgba(255,247,238,0.85)',
  onTerracotta70:  'rgba(255,247,238,0.70)',
  onTerracotta60:  'rgba(255,247,238,0.60)',
  onTerracotta20:  'rgba(255,247,238,0.20)',
  onTerracotta18:  'rgba(255,247,238,0.18)',
  isDark: true,
};

export const PALETTES = { light: LIGHT, dark: DARK };

// Default export: light palette. Used at module-load time as a sensible
// default for things that can't easily go through context (e.g. icon
// default-prop values when not yet rendered).
export const C = LIGHT;

export const FONT = {
  ui: 'System',
  uiSemi: 'System',
  display: 'Fraunces_500Medium',
  displayBold: 'Fraunces_600SemiBold',
};

const ThemeContext = createContext({
  mode: 'light',
  C: LIGHT,
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ mode, setMode, children }) {
  const value = useMemo(() => ({
    mode,
    C: PALETTES[mode] || LIGHT,
    setMode,
  }), [mode, setMode]);
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// Helper: turn `(C) => ({...})` into a memoized StyleSheet for the active palette.
export function useStyles(makeStyles) {
  const { C } = useTheme();
  return useMemo(() => StyleSheet.create(makeStyles(C)), [C, makeStyles]);
}

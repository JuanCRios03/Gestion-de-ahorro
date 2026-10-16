// Paleta validada (ver skill de dataviz) para gráficos + tokens de marca navy/gris para el chrome de la UI.
// El slot categórico "red" queda reservado exclusivamente para alertas de gasto por encima del promedio.

export const CATEGORICAL = {
  blue: { light: '#2a78d6', dark: '#3987e5' },
  orange: { light: '#eb6834', dark: '#d95926' },
  aqua: { light: '#1baf7a', dark: '#199e70' },
  yellow: { light: '#eda100', dark: '#c98500' },
  magenta: { light: '#e87ba4', dark: '#d55181' },
  green: { light: '#008300', dark: '#008300' },
  violet: { light: '#4a3aa7', dark: '#9085e9' },
  gray: { light: '#898781', dark: '#a4a29b' },
};

export const STATUS = {
  good: { light: '#0ca30c', dark: '#0ca30c' },
  warning: { light: '#fab219', dark: '#fab219' },
  serious: { light: '#ec835a', dark: '#ec835a' },
  critical: { light: '#d03b3b', dark: '#e66767' },
};

export const CHROME = {
  light: {
    surface: '#fcfcfb',
    page: '#f9f9f7',
    primaryInk: '#0b0b0b',
    secondaryInk: '#52514e',
    mutedInk: '#898781',
    gridline: '#e1e0d9',
    baseline: '#c3c2b7',
    successText: '#006300',
  },
  dark: {
    surface: '#1a1a19',
    page: '#0d0d0d',
    primaryInk: '#ffffff',
    secondaryInk: '#c3c2b7',
    mutedInk: '#898781',
    gridline: '#2c2c2a',
    baseline: '#383835',
    successText: '#0ca30c',
  },
};

export function colorForSlot(slot, mode = 'light') {
  const entry = CATEGORICAL[slot] || CATEGORICAL.gray;
  return entry[mode] || entry.light;
}

export function useColorScheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

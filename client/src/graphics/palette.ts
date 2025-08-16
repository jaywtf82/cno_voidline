// Color palette for audio visualizations
export const palette = {
  primary: {
    green: '#22c55e',
    dark: '#15803d',
    light: '#86efac',
  },
  audio: {
    preSource: '#3b82f6',   // Blue for A channel (pre)
    postSource: '#f97316',  // Orange for B channel (post)
    spectrum: '#10b981',    // Green for spectrum
    correlation: '#8b5cf6', // Purple for correlation
  },
  metrics: {
    good: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    neutral: '#6b7280',
  },
  ui: {
    background: '#111827',
    card: '#1f2937',
    border: '#374151',
    text: '#f9fafb',
    muted: '#9ca3af',
  }
} as const;

export type PaletteColor = keyof typeof palette;
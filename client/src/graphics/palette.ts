// Terminal theme color palette as floats for WebGL
export const palette = {
  // Primary colors (normalized to 0-1)
  terminal: {
    green: [0.134, 0.773, 0.369, 1.0] as const,      // #22c55e
    cyan: [0.052, 0.773, 0.831, 1.0] as const,       // #0dd4d4
    orange: [1.0, 0.596, 0.0, 1.0] as const,         // #ff9800
    red: [0.956, 0.263, 0.212, 1.0] as const,        // #f44336
    blue: [0.129, 0.588, 0.953, 1.0] as const,       // #2196f3
    purple: [0.612, 0.153, 0.690, 1.0] as const,     // #9c27b0
  },
  
  // Background levels
  background: {
    primary: [0.016, 0.016, 0.016, 1.0] as const,    // Very dark
    secondary: [0.039, 0.039, 0.039, 1.0] as const,  // Slightly lighter
    muted: [0.063, 0.063, 0.063, 1.0] as const,      // Card backgrounds
  },
  
  // Text levels
  text: {
    primary: [1.0, 1.0, 1.0, 1.0] as const,          // White
    secondary: [0.878, 0.878, 0.878, 1.0] as const,  // Light gray
    muted: [0.576, 0.576, 0.576, 1.0] as const,      // Dimmed
  },
  
  // Audio visualization specific
  audio: {
    preSource: [1.0, 0.596, 0.0, 0.8] as const,      // Orange for pre-processing
    postSource: [0.052, 0.773, 0.831, 0.9] as const, // Cyan for post-processing  
    neutral: [0.576, 0.576, 0.576, 0.6] as const,    // Gray for neutral elements
    peak: [0.956, 0.263, 0.212, 1.0] as const,       // Red for peaks/warnings
  }
};
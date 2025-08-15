
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeType = "classic" | "matrix" | "cyberpunk" | "retro";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  glow: string;
  glowStrong: string;
}

const themeConfigs: Record<ThemeType, ThemeConfig> = {
  classic: {
    primary: "#3FB950",
    secondary: "#2EA043",
    accent: "#00D4FF",
    background: "#0B0C0E",
    foreground: "#C9D1D9",
    glow: "#3FB950",
    glowStrong: "#3FB950aa",
  },
  matrix: {
    primary: "#00FF41",
    secondary: "#00D435",
    accent: "#39FF14",
    background: "#0A0A0A",
    foreground: "#00FF41",
    glow: "#00FF41",
    glowStrong: "#00FF41aa",
  },
  cyberpunk: {
    primary: "#00D4FF",
    secondary: "#0099CC",
    accent: "#FF0080",
    background: "#0D1117",
    foreground: "#E6F7FF",
    glow: "#00D4FF",
    glowStrong: "#00D4FFaa",
  },
  retro: {
    primary: "#FF8C42",
    secondary: "#FF6B1A",
    accent: "#FFD700",
    background: "#1A1A1A",
    foreground: "#FFF8DC",
    glow: "#FF8C42",
    glowStrong: "#FF8C42aa",
  },
};

interface ThemeState {
  theme: ThemeType;
  customThemes: Record<string, ThemeConfig>;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  addCustomTheme: (name: string, config: ThemeConfig) => void;
  removeCustomTheme: (name: string) => void;
  getThemeColors: () => ThemeConfig;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "classic",
      customThemes: {},
      
      setTheme: (theme: ThemeType) => {
        set({ theme });
        
        // Apply theme to CSS variables
        if (typeof window !== "undefined") {
          const root = document.documentElement;
          const config = themeConfigs[theme];
          
          root.style.setProperty("--theme-primary", config.primary);
          root.style.setProperty("--theme-secondary", config.secondary);
          root.style.setProperty("--theme-accent", config.accent);
          root.style.setProperty("--theme-background", config.background);
          root.style.setProperty("--theme-foreground", config.foreground);
          root.style.setProperty("--theme-glow", config.glow);
          root.style.setProperty("--theme-glow-strong", config.glowStrong);
        }
      },

      toggleTheme: () => {
        const themes: ThemeType[] = ["classic", "matrix", "cyberpunk", "retro"];
        const currentIndex = themes.indexOf(get().theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        get().setTheme(themes[nextIndex]);
      },

      addCustomTheme: (name: string, config: ThemeConfig) => {
        set(state => ({
          customThemes: {
            ...state.customThemes,
            [name]: config,
          },
        }));
      },

      removeCustomTheme: (name: string) => {
        set(state => {
          const { [name]: removed, ...rest } = state.customThemes;
          return { customThemes: rest };
        });
      },

      getThemeColors: () => {
        const { theme } = get();
        return themeConfigs[theme];
      },
    }),
    {
      name: "voidline-theme-store",
      partialize: (state) => ({
        theme: state.theme,
        customThemes: state.customThemes,
      }),
    }
  )
);

// Apply initial theme on load
if (typeof window !== "undefined") {
  const initialTheme = useThemeStore.getState().theme;
  useThemeStore.getState().setTheme(initialTheme);
}

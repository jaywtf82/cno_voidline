import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeType = "classic" | "matrix" | "cyberpunk" | "retro";

interface ThemeState {
  theme: ThemeType;
  isTransitioning: boolean;
  customThemes: Record<string, any>;
  
  // Actions
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
  addCustomTheme: (name: string, config: any) => void;
  removeCustomTheme: (name: string) => void;
  getThemeColors: () => ThemeColors;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  glow: string;
  glowStrong: string;
}

const themeConfigs: Record<ThemeType, ThemeColors> = {
  classic: {
    primary: "#3FB950",
    secondary: "#2EA043", 
    glow: "rgba(63, 185, 80, 0.6)",
    glowStrong: "rgba(63, 185, 80, 0.8)",
  },
  matrix: {
    primary: "#00FF41",
    secondary: "#00CC33",
    glow: "rgba(0, 255, 65, 0.6)",
    glowStrong: "rgba(0, 255, 65, 0.8)",
  },
  cyberpunk: {
    primary: "#00D4FF",
    secondary: "#B794F6",
    glow: "rgba(0, 212, 255, 0.6)",
    glowStrong: "rgba(0, 212, 255, 0.8)",
  },
  retro: {
    primary: "#FF8C42",
    secondary: "#17A2B8",
    glow: "rgba(255, 140, 66, 0.6)",
    glowStrong: "rgba(255, 140, 66, 0.8)",
  },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "classic",
      isTransitioning: false,
      customThemes: {},

      setTheme: (theme: ThemeType) => {
        set({ isTransitioning: true });
        
        // Apply theme to document
        const root = document.documentElement;
        
        // Remove all theme classes
        Object.keys(themeConfigs).forEach(themeName => {
          root.classList.remove(`theme-${themeName}`);
        });
        
        // Add new theme class (except classic which is default)
        if (theme !== "classic") {
          root.classList.add(`theme-${theme}`);
        }
        
        set({ theme });
        
        // Reset transition state
        setTimeout(() => {
          set({ isTransitioning: false });
        }, 300);
      },

      toggleTheme: () => {
        const themes: ThemeType[] = ["classic", "matrix", "cyberpunk", "retro"];
        const currentIndex = themes.indexOf(get().theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        get().setTheme(themes[nextIndex]);
      },

      addCustomTheme: (name: string, config: any) => {
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

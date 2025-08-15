import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";

type ThemeType = "classic" | "matrix" | "cyberpunk" | "retro";

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

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  config: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("voidline-theme");
      return (saved as ThemeType) || "classic";
    }
    return "classic";
  });
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences if authenticated
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/preferences"],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      return await apiRequest("GET", "/api/preferences");
    },
    enabled: isAuthenticated,
    retry: false,
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: ThemeType) => {
      if (!isAuthenticated) {
        // Store in localStorage for non-authenticated users
        localStorage.setItem("voidline-theme", newTheme);
        return;
      }

      await apiRequest("POST", "/api/preferences", {
        theme: newTheme,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
    },
  });

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    updateThemeMutation.mutate(newTheme);
  };

  // Load theme from preferences or localStorage
  useEffect(() => {
    if (isAuthenticated && preferences?.theme) {
      setThemeState(preferences.theme as ThemeType);
    } else if (!isAuthenticated) {
      const savedTheme = localStorage.getItem("voidline-theme") as ThemeType;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }
  }, [isAuthenticated, preferences]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const config = themeConfigs[theme];

    // Remove all theme classes
    root.classList.remove("theme-classic", "theme-matrix", "theme-cyberpunk", "theme-retro");

    // Add current theme class if not classic
    if (theme !== "classic") {
      root.classList.add(`theme-${theme}`);
    }

    // Set CSS variables for our custom themes
    root.style.setProperty("--theme-primary", config.primary);
    root.style.setProperty("--theme-secondary", config.secondary);
    root.style.setProperty("--theme-accent", config.accent);
    root.style.setProperty("--theme-background", config.background);
    root.style.setProperty("--theme-foreground", config.foreground);
    root.style.setProperty("--theme-glow", config.glow);
    root.style.setProperty("--theme-glow-strong", config.glowStrong);

    // Set shadcn/ui variables
    root.style.setProperty("--background", config.background);
    root.style.setProperty("--foreground", config.foreground);
    root.style.setProperty("--primary", config.primary);
    root.style.setProperty("--primary-foreground", config.background);
    root.style.setProperty("--secondary", config.secondary);
    root.style.setProperty("--secondary-foreground", config.foreground);
    root.style.setProperty("--accent", config.accent);
    root.style.setProperty("--accent-foreground", config.background);
    root.style.setProperty("--border", config.glow + "33");
    root.style.setProperty("--ring", config.accent);
    root.style.setProperty("--muted", config.background);
    root.style.setProperty("--muted-foreground", config.foreground + "99");

    // Set font variables
    root.style.setProperty("--font-sans", "Inter, sans-serif");
    root.style.setProperty("--font-mono", "Fira Code, monospace");

    // Save to localStorage
    localStorage.setItem("voidline-theme", theme);
  }, [theme, isAuthenticated, preferences]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading, config: themeConfigs[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
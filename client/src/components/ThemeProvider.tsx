import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

type Theme = "classic" | "matrix" | "cyberpunk" | "retro";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("classic");
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user preferences if authenticated
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/preferences"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (newTheme: Theme) => {
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

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    updateThemeMutation.mutate(newTheme);
  };

  // Load theme from preferences or localStorage
  useEffect(() => {
    if (isAuthenticated && preferences?.theme) {
      setThemeState(preferences.theme as Theme);
    } else if (!isAuthenticated) {
      const savedTheme = localStorage.getItem("voidline-theme") as Theme;
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    }
  }, [isAuthenticated, preferences]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("theme-classic", "theme-matrix", "theme-cyberpunk", "theme-retro");
    
    // Add current theme class
    if (theme !== "classic") {
      root.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // Voidline theme colors from CSS variables
        bg: "var(--bg)",
        surface: "var(--bg-elev)",
        grid: "var(--grid)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: {
          DEFAULT: "var(--accent)",
          600: "var(--accent-600)",
          200: "var(--accent-200)",
        },
        warn: "var(--warn)",
        info: "var(--info)",
        danger: "var(--danger)",
        // Surface colors
        surface: {
          dark: "var(--bg)",
          darker: "var(--bg-elev)",
        },
        // Terminal accent colors
        accent: {
          primary: "var(--accent)",
          secondary: "var(--accent-600)",
          matrix: "#00FF41",
          cyber: "#00D4FF",
          purple: "#B794F6",
          retro: "#FF8C42",
          cyan: "#17A2B8",
        },
        // Text colors
        text: {
          primary: "var(--text)",
          secondary: "var(--muted)",
          muted: "var(--muted)",
        },
        // Theme variables
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar-background)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "Fira Code", "monospace"],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "radar-sweep": "radar-sweep 3s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite alternate",
        "signal-scan": "signal-scan 1.5s ease-in-out infinite",
        "phase-connect": "phase-connect 4s ease-in-out infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "radar-sweep": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "glow-pulse": {
          "0%": { boxShadow: "0 0 5px var(--theme-glow)" },
          "100%": { boxShadow: "0 0 25px var(--theme-glow-strong)" },
        },
        "signal-scan": {
          "0%, 100%": { opacity: "0.4", transform: "scaleY(0.8)" },
          "50%": { opacity: "1", transform: "scaleY(1.2)" },
        },
        "phase-connect": {
          "0%, 100%": { strokeDashoffset: "20" },
          "50%": { strokeDashoffset: "0" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 10px var(--theme-glow)",
        "glow-md": "0 0 20px var(--theme-glow)",
        "glow-lg": "0 0 30px var(--theme-glow-strong)",
        "terminal": "0 4px 20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        "card": "0 2px 12px var(--shadow)",
        "card-hover": "0 8px 24px rgba(0,0,0,.45)",
      },
      backgroundImage: {
        "voidline-surface": "linear-gradient(180deg, color-mix(in srgb, var(--bg-elev) 88%, transparent), var(--bg-elev))",
      },
      transitionTimingFunction: {
        "void-snap": "cubic-bezier(.2,.6,.2,1)",
      },
      textShadow: {
        glow: "0 0 10px var(--theme-glow)",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    // Custom plugin for text shadow
    function({ addUtilities }: any) {
      const newUtilities = {
        '.text-shadow-glow': {
          textShadow: '0 0 10px var(--theme-glow)',
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;

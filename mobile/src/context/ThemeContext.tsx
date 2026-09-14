import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeMode } from "../types";

export interface ColorPalette {
  background: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  danger: string;
  success: string;
  card: string;
  navBackground: string;
  navActive: string;
  navInactive: string;
  highlightAmber: string;
  highlightEmerald: string;
  highlightSky: string;
  highlightRose: string;
  highlightViolet: string;
}

export const themes: Record<ThemeMode, ColorPalette> = {
  dark: {
    background: "#0b0f17",
    surface: "#111827",
    surfaceHover: "#1f293d",
    border: "#1e293b",
    borderSubtle: "#172033",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    textMuted: "#64748b",
    accent: "#f59e0b",
    accentLight: "#fbbf24",
    accentDark: "#d97706",
    danger: "#ef4444",
    success: "#10b981",
    card: "#131b2e",
    navBackground: "#0d131f",
    navActive: "#f59e0b",
    navInactive: "#64748b",
    highlightAmber: "rgba(245, 158, 11, 0.35)",
    highlightEmerald: "rgba(16, 185, 129, 0.35)",
    highlightSky: "rgba(14, 165, 233, 0.35)",
    highlightRose: "rgba(244, 63, 94, 0.35)",
    highlightViolet: "rgba(139, 92, 246, 0.35)",
  },
  light: {
    background: "#f8fafc",
    surface: "#ffffff",
    surfaceHover: "#f1f5f9",
    border: "#e2e8f0",
    borderSubtle: "#f1f5f9",
    textPrimary: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    accent: "#d97706",
    accentLight: "#f59e0b",
    accentDark: "#b45309",
    danger: "#dc2626",
    success: "#059669",
    card: "#ffffff",
    navBackground: "#ffffff",
    navActive: "#d97706",
    navInactive: "#94a3b8",
    highlightAmber: "rgba(251, 191, 36, 0.5)",
    highlightEmerald: "rgba(52, 211, 153, 0.5)",
    highlightSky: "rgba(56, 189, 248, 0.5)",
    highlightRose: "rgba(251, 113, 133, 0.5)",
    highlightViolet: "rgba(167, 139, 250, 0.5)",
  },
  sepia: {
    background: "#f6edd9",
    surface: "#eee2c7",
    surfaceHover: "#e5d6b4",
    border: "#dccbb0",
    borderSubtle: "#e9dac0",
    textPrimary: "#432818",
    textSecondary: "#6f4e37",
    textMuted: "#997b66",
    accent: "#9c4a1a",
    accentLight: "#b85d26",
    accentDark: "#7f3b12",
    danger: "#b91c1c",
    success: "#2d6a4f",
    card: "#ede0c4",
    navBackground: "#ecdcb9",
    navActive: "#9c4a1a",
    navInactive: "#997b66",
    highlightAmber: "rgba(234, 179, 8, 0.4)",
    highlightEmerald: "rgba(34, 197, 94, 0.4)",
    highlightSky: "rgba(14, 165, 233, 0.4)",
    highlightRose: "rgba(244, 63, 94, 0.4)",
    highlightViolet: "rgba(168, 85, 247, 0.4)",
  },
};

interface ThemeContextType {
  mode: ThemeMode;
  colors: ColorPalette;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: "dark",
  colors: themes.dark,
  setMode: () => {},
  toggleTheme: () => {},
});

const THEME_STORAGE_KEY = "taleora_mobile_theme_mode";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === "dark" || saved === "light" || saved === "sepia")) {
          setModeState(saved as ThemeMode);
        }
      } catch {
        // Fallback to dark
      }
    })();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const nextMode: ThemeMode = mode === "dark" ? "light" : mode === "light" ? "sepia" : "dark";
    setMode(nextMode);
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        colors: themes[mode],
        setMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

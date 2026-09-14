"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Sun, Moon, Monitor } from "lucide-react";

const emptySubscribe = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  // Idiomatic React 19 hydration-safe check without setState in effect
  const mounted = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-lg border border-border/60 bg-secondary/40 animate-pulse" />
    );
  }

  const toggleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  const getLabel = () => {
    if (theme === "dark") return "Dark theme active (Click for System)";
    if (theme === "light") return "Light theme active (Click for Dark)";
    return "System theme active (Click for Light)";
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={getLabel()}
      title={getLabel()}
      className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card hover:bg-secondary text-foreground/80 hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 active:scale-95 cursor-pointer shadow-xs"
    >
      {theme === "light" && <Sun className="w-4 h-4 text-amber-600 transition-transform duration-200 rotate-0 scale-100" />}
      {theme === "dark" && <Moon className="w-4 h-4 text-primary transition-transform duration-200 rotate-0 scale-100" />}
      {theme === "system" && <Monitor className="w-4 h-4 text-muted-foreground transition-transform duration-200 rotate-0 scale-100" />}
    </button>
  );
}

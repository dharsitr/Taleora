"use client";

import * as React from "react";
import { Settings, Eye, Type, Moon, Sun, Monitor, BellOff } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = React.useState("medium");
  const [distractionFree, setDistractionFree] = React.useState(false);

  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col gap-2 border-b border-border/70 pb-5">
        <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          <span>Reader Preferences</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          Display & Reader Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Customize your reading environment for optimum comfort and focus.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <span>Color Theme</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Choose between warm paper parchment, deep night obsidian, or follow your system.
                </CardDescription>
              </div>
              <ThemeToggle />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  theme === "light"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Sun className="w-4 h-4 text-amber-600" />
                  <span>Warm Paper (Light)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Soft sepia paper background to reduce eye strain in daylight.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  theme === "dark"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Moon className="w-4 h-4 text-primary" />
                  <span>Obsidian (Dark)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Deep charcoal and slate for comfortable evening reading.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTheme("system")}
                className={cn(
                  "flex flex-col gap-2 p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                  theme === "system"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-secondary/50"
                )}
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <Monitor className="w-4 h-4 text-muted-foreground" />
                  <span>Automatic (System)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically match your device&apos;s OS light/dark schedule.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Typography Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
              <span>Reader Typography</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Test font scaling and readability.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              {["small", "medium", "large"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer",
                    fontSize === size
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                  )}
                >
                  {size} Text
                </button>
              ))}
            </div>

            <div className="p-4 rounded-xl border border-border bg-secondary/30 font-serif leading-relaxed">
              <p
                className={cn(
                  "transition-all duration-200",
                  fontSize === "small" && "text-sm",
                  fontSize === "medium" && "text-base",
                  fontSize === "large" && "text-lg"
                )}
              >
                &ldquo;She traced the constellations charted across the parchment. The stars, once thought to be static embers in an indifferent sky, pulsed with the steady rhythm of a sleeping giant.&rdquo;
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Distraction Free Mode */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BellOff className="w-5 h-5 text-primary" />
                  <span>Distraction-Free Reading Mode</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Hides secondary badges and notification dots while reading story chapters.
                </CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setDistractionFree(!distractionFree)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative cursor-pointer",
                  distractionFree ? "bg-primary" : "bg-border"
                )}
              >
                <span
                  className={cn(
                    "block w-4 h-4 rounded-full bg-white transition-transform absolute top-1",
                    distractionFree ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

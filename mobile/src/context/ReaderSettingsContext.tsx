import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReaderFontFamily, ThemeMode } from "../types";

export interface ReaderSettings {
  theme: ThemeMode;
  fontSize: number;
  lineHeight: number;
  fontFamily: ReaderFontFamily;
  isPaged: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  theme: "dark",
  fontSize: 18,
  lineHeight: 1.7,
  fontFamily: "serif",
  isPaged: false,
};

interface ReaderSettingsContextType {
  settings: ReaderSettings;
  updateSettings: (partial: Partial<ReaderSettings>) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setFontFamily: (fontFamily: ReaderFontFamily) => void;
  setReaderTheme: (theme: ThemeMode) => void;
  togglePaged: () => void;
  resetDefaults: () => void;
}

const ReaderSettingsContext = createContext<ReaderSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  increaseFontSize: () => {},
  decreaseFontSize: () => {},
  setFontFamily: () => {},
  setReaderTheme: () => {},
  togglePaged: () => {},
  resetDefaults: () => {},
});

const STORAGE_KEY = "taleora_mobile_reader_settings";

export const ReaderSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      } catch {
        // Fallback to default
      }
    })();
  }, []);

  const saveSettings = async (newSettings: ReaderSettings) => {
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch {
      // ignore
    }
  };

  const updateSettings = (partial: Partial<ReaderSettings>) => {
    saveSettings({ ...settings, ...partial });
  };

  const increaseFontSize = () => {
    if (settings.fontSize < 28) {
      updateSettings({ fontSize: settings.fontSize + 1 });
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 14) {
      updateSettings({ fontSize: settings.fontSize - 1 });
    }
  };

  const setFontFamily = (fontFamily: ReaderFontFamily) => {
    updateSettings({ fontFamily });
  };

  const setReaderTheme = (theme: ThemeMode) => {
    updateSettings({ theme });
  };

  const togglePaged = () => {
    updateSettings({ isPaged: !settings.isPaged });
  };

  const resetDefaults = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  return (
    <ReaderSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        increaseFontSize,
        decreaseFontSize,
        setFontFamily,
        setReaderTheme,
        togglePaged,
        resetDefaults,
      }}
    >
      {children}
    </ReaderSettingsContext.Provider>
  );
};

export const useReaderSettings = () => useContext(ReaderSettingsContext);

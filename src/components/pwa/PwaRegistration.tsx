"use client";

import * as React from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Global state for PWA install prompt
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const promptListeners = new Set<(canInstall: boolean) => void>();

export function getCanInstallPwa(): boolean {
  return deferredPrompt !== null;
}

export function subscribePwaInstall(callback: (canInstall: boolean) => void): () => void {
  promptListeners.add(callback);
  callback(deferredPrompt !== null);
  return () => {
    promptListeners.delete(callback);
  };
}

export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;

  try {
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    promptListeners.forEach((fn) => fn(false));
    return choice.outcome === "accepted";
  } catch (err) {
    console.warn("PWA installation prompt failed:", err);
    return false;
  }
}

export function PwaRegistration() {
  React.useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register after window loads to not block initial paint
      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for worker updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                      console.log("[PWA] New content is available; please refresh.");
                    } else {
                      console.log("[PWA] Content is cached for offline use.");
                    }
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      };

      if (document.readyState === "complete") {
        handleLoad();
      } else {
        window.addEventListener("load", handleLoad);
        return () => window.removeEventListener("load", handleLoad);
      }
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if running as installed standalone app
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent automatic browser mini-infobar on mobile
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      promptListeners.forEach((fn) => fn(true));
      window.dispatchEvent(new CustomEvent("taleora-pwa-installable", { detail: true }));
    };

    const handleAppInstalled = () => {
      deferredPrompt = null;
      promptListeners.forEach((fn) => fn(false));
      window.dispatchEvent(new CustomEvent("taleora-pwa-installable", { detail: false }));
      console.log("[PWA] Taleora was successfully installed!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return null;
}

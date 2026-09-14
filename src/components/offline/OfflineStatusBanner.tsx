"use client";

import * as React from "react";
import { WifiOff, Wifi, CheckCircle2 } from "lucide-react";
import { initOfflineSyncListeners } from "@/lib/offline/sync";

export function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [showReconnected, setShowReconnected] = React.useState(false);
  const [syncNotice, setSyncNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    // Initialize auto-sync on reconnect
    const cleanupSync = initOfflineSyncListeners();

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    const handleSyncDone = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.syncedCount > 0) {
        setSyncNotice(`Synced ${detail.syncedCount} reading update${detail.syncedCount > 1 ? "s" : ""} to cloud`);
        setTimeout(() => setSyncNotice(null), 4000);
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("taleora-offline-sync-completed", handleSyncDone);

    return () => {
      cleanupSync();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("taleora-offline-sync-completed", handleSyncDone);
    };
  }, []);

  // If online and no reconnected notice or sync message, don't render anything
  if (isOnline && !showReconnected && !syncNotice) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-3 duration-300 pointer-events-none"
    >
      <div className="pointer-events-auto">
        {!isOnline ? (
          // Offline Status Pill
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-900/95 text-stone-100 border border-amber-500/40 shadow-2xl backdrop-blur-md text-xs font-medium">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <WifiOff className="w-4 h-4 text-amber-400" />
            <span>Offline Mode · Reading from saved library</span>
          </div>
        ) : syncNotice ? (
          // Sync Complete Pill
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-900/95 text-stone-100 border border-primary/40 shadow-2xl backdrop-blur-md text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-primary animate-in zoom-in" />
            <span>{syncNotice}</span>
          </div>
        ) : (
          // Reconnected Pill
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-stone-900/95 text-stone-100 border border-emerald-500/40 shadow-2xl backdrop-blur-md text-xs font-medium">
            <Wifi className="w-4 h-4 text-emerald-400" />
            <span>Connection Restored · Reading progress synced</span>
          </div>
        )}
      </div>
    </div>
  );
}

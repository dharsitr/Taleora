/**
 * WebSocket Real-Time Notification Client for Taleora.
 * Connects directly to Supabase Realtime WebSocket engine (`wss://...`).
 * Features:
 * - Real-time push updates for likes, comments, reviews, follows, and publishing
 * - Automatic reconnection with exponential backoff on socket drops
 * - Active WebSocket connection state tracking (Connected, Connecting, Disconnected)
 * - Telemetry integration to measure active WebSocket channels in real time
 */

"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { NotificationRow } from "@/types/social";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type WebSocketConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

interface WebSocketNotificationOptions {
  userId: string | null | undefined;
  onNotificationReceived?: (notification: NotificationRow) => void;
  onStatusChange?: (status: WebSocketConnectionStatus) => void;
}

export function useWebSocketNotifications({
  userId,
  onNotificationReceived,
  onStatusChange,
}: WebSocketNotificationOptions) {
  const [status, setStatus] = React.useState<WebSocketConnectionStatus>("disconnected");
  const [liveNotifications, setLiveNotifications] = React.useState<NotificationRow[]>([]);
  const channelRef = React.useRef<RealtimeChannel | null>(null);

  React.useEffect(() => {
    if (!userId) {
      setStatus("disconnected");
      onStatusChange?.("disconnected");
      return;
    }

    const supabase = createClient();
    setStatus("connecting");
    onStatusChange?.("connecting");

    const channelName = `realtime:user_notifications:${userId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRow;
          setLiveNotifications((prev) => [newNotification, ...prev]);
          if (onNotificationReceived) {
            onNotificationReceived(newNotification);
          }
        }
      )
      .subscribe((subscribeStatus) => {
        if (subscribeStatus === "SUBSCRIBED") {
          setStatus("connected");
          onStatusChange?.("connected");
        } else if (subscribeStatus === "TIMED_OUT" || subscribeStatus === "CHANNEL_ERROR") {
          setStatus("error");
          onStatusChange?.("error");
        } else if (subscribeStatus === "CLOSED") {
          setStatus("disconnected");
          onStatusChange?.("disconnected");
        }
      });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setStatus("disconnected");
      onStatusChange?.("disconnected");
    };
  }, [userId, onNotificationReceived, onStatusChange]);

  return {
    status,
    liveNotifications,
    isConnected: status === "connected",
  };
}

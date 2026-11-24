/**
 * Supabase Realtime Reader Presence & Margin Highlight Sync for Taleora.
 * Manages live reader presence on chapters, presence tracking,
 * and peer-to-peer broadcast of real-time highlights and margin thoughts.
 */

import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { HighlightRow } from "@/types/books";

export interface ReaderPresenceUser {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  joinedAt: number;
}

export interface PresenceState {
  onlineCount: number;
  users: ReaderPresenceUser[];
  isConnected: boolean;
}

export interface UseReaderPresenceOptions {
  chapterId: string;
  bookId: string;
  currentUser?: {
    id: string;
    name?: string;
    avatarUrl?: string | null;
  } | null;
  onRemoteHighlightCreated?: (highlight: HighlightRow) => void;
  onRemoteHighlightDeleted?: (highlightId: string) => void;
  onPresenceChange?: (state: PresenceState) => void;
}

class ReaderPresenceEngine {
  private channel: RealtimeChannel | null = null;
  private currentChapterId: string | null = null;
  private state: PresenceState = {
    onlineCount: 1,
    users: [],
    isConnected: false,
  };
  private listeners: Set<(state: PresenceState) => void> = new Set();
  private onHighlightCallback: ((h: HighlightRow) => void) | null = null;
  private onDeleteHighlightCallback: ((id: string) => void) | null = null;

  public subscribePresence(listener: (state: PresenceState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (err) {
        console.warn("Presence listener error:", err);
      }
    });
  }

  public joinChapter(options: UseReaderPresenceOptions): void {
    if (typeof window === "undefined") return;

    // Leave existing channel if switching chapters
    if (this.channel) {
      this.leaveChapter();
    }

    const supabase = createClient();
    this.currentChapterId = options.chapterId;
    this.onHighlightCallback = options.onRemoteHighlightCreated || null;
    this.onDeleteHighlightCallback = options.onRemoteHighlightDeleted || null;

    const channelName = `taleora_presence_chapter_${options.chapterId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: options.currentUser?.id || `anon_${Math.random().toString(36).slice(2, 8)}`,
        },
      },
    });

    // 1. Listen for Presence Sync
    channel.on("presence", { event: "sync" }, () => {
      const presenceState = channel.presenceState();
      const users: ReaderPresenceUser[] = [];

      Object.values(presenceState).forEach((presences) => {
        (presences as Array<Record<string, unknown>>).forEach((p) => {
          if (p && typeof p === "object") {
            users.push({
              userId: (p.userId as string) || "anonymous",
              name: (p.name as string) || "Fellow Reader",
              avatarUrl: (p.avatarUrl as string) || null,
              joinedAt: (p.joinedAt as number) || Date.now(),
            });
          }
        });
      });

      // Guarantee at least 1 reader (self)
      this.state = {
        onlineCount: Math.max(1, users.length),
        users,
        isConnected: true,
      };
      this.notify();
      options.onPresenceChange?.(this.state);
    });

    // 2. Listen for Real-Time Broadcast of Highlights
    channel.on("broadcast", { event: "new_highlight" }, (eventPayload: { payload: { highlight?: HighlightRow } }) => {
      const payload = eventPayload?.payload;
      if (payload && payload.highlight && this.onHighlightCallback) {
        this.onHighlightCallback(payload.highlight as HighlightRow);
      }
    });

    channel.on("broadcast", { event: "delete_highlight" }, (eventPayload: { payload: { highlightId?: string } }) => {
      const payload = eventPayload?.payload;
      if (payload && payload.highlightId && this.onDeleteHighlightCallback) {
        this.onDeleteHighlightCallback(payload.highlightId as string);
      }
    });

    // Subscribe and track self presence
    channel.subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") {
        this.state.isConnected = true;
        this.notify();

        const currentUser = options.currentUser;
        await channel.track({
          userId: currentUser?.id || `anon_${Math.random().toString(36).slice(2, 8)}`,
          name: currentUser?.name || "Fellow Reader",
          avatarUrl: currentUser?.avatarUrl || null,
          joinedAt: Date.now(),
        });
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        this.state.isConnected = false;
        this.notify();
      }
    });

    this.channel = channel;
  }

  public broadcastHighlight(highlight: HighlightRow): void {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: "broadcast",
        event: "new_highlight",
        payload: { highlight },
      });
    } catch (err) {
      console.warn("Failed to broadcast highlight:", err);
    }
  }

  public broadcastDeleteHighlight(highlightId: string): void {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: "broadcast",
        event: "delete_highlight",
        payload: { highlightId },
      });
    } catch (err) {
      console.warn("Failed to broadcast delete highlight:", err);
    }
  }

  public leaveChapter(): void {
    if (this.channel) {
      try {
        const supabase = createClient();
        supabase.removeChannel(this.channel);
      } catch (err) {
        console.warn("Error leaving presence channel:", err);
      }
      this.channel = null;
    }
    this.currentChapterId = null;
    this.state = {
      onlineCount: 1,
      users: [],
      isConnected: false,
    };
    this.notify();
  }

  public getState(): PresenceState {
    return this.state;
  }
}

export const readerPresenceEngine = new ReaderPresenceEngine();

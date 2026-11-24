/**
 * Synchronized Reading Parlor & Floating Reactions Engine for Taleora.
 * Powered by Supabase Realtime broadcast channels.
 * Enables live co-reading rooms, host-guided page sync, and floating emoji reactions.
 */

import { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface ParlorReaction {
  id: string;
  emoji: string;
  senderName: string;
  timestamp: number;
}

export interface ParlorSyncPayload {
  chapterSlug: string;
  pageNumber: number;
  hostName: string;
}

export type ReactionListener = (reaction: ParlorReaction) => void;
export type SyncPageListener = (payload: ParlorSyncPayload) => void;

class ReadingParlorEngine {
  private channel: RealtimeChannel | null = null;
  private currentRoomId: string | null = null;
  private reactionListeners: Set<ReactionListener> = new Set();
  private pageListeners: Set<SyncPageListener> = new Set();

  public joinRoom(roomId: string): void {
    if (typeof window === "undefined") return;
    if (this.channel) this.leaveRoom();

    const supabase = createClient();
    this.currentRoomId = roomId;

    const channel = supabase.channel(`taleora_parlor_${roomId}`, {
      config: { broadcast: { self: true } },
    });

    channel.on(
      "broadcast",
      { event: "reaction" },
      (eventPayload: { payload: { reaction?: ParlorReaction } }) => {
        const reaction = eventPayload?.payload?.reaction;
        if (reaction) {
          this.reactionListeners.forEach((fn) => fn(reaction));
        }
      }
    );

    channel.on(
      "broadcast",
      { event: "sync_page" },
      (eventPayload: { payload: { sync?: ParlorSyncPayload } }) => {
        const sync = eventPayload?.payload?.sync;
        if (sync) {
          this.pageListeners.forEach((fn) => fn(sync));
        }
      }
    );

    channel.subscribe();
    this.channel = channel;
  }

  public sendReaction(emoji: string, senderName = "Reader"): void {
    if (!this.channel) return;
    const reaction: ParlorReaction = {
      id: `rx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      senderName,
      timestamp: Date.now(),
    };

    try {
      this.channel.send({
        type: "broadcast",
        event: "reaction",
        payload: { reaction },
      });
    } catch (err) {
      console.warn("Failed to broadcast reaction:", err);
    }
  }

  public broadcastPageTurn(chapterSlug: string, pageNumber: number, hostName = "Host"): void {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: "broadcast",
        event: "sync_page",
        payload: {
          sync: { chapterSlug, pageNumber, hostName },
        },
      });
    } catch (err) {
      console.warn("Failed to broadcast page sync:", err);
    }
  }

  public subscribeReactions(listener: ReactionListener): () => void {
    this.reactionListeners.add(listener);
    return () => {
      this.reactionListeners.delete(listener);
    };
  }

  public subscribePageSync(listener: SyncPageListener): () => void {
    this.pageListeners.add(listener);
    return () => {
      this.pageListeners.delete(listener);
    };
  }

  public leaveRoom(): void {
    if (this.channel) {
      try {
        const supabase = createClient();
        supabase.removeChannel(this.channel);
      } catch (err) {
        console.warn("Error leaving parlor:", err);
      }
      this.channel = null;
    }
    this.currentRoomId = null;
    this.reactionListeners.clear();
    this.pageListeners.clear();
  }

  public getActiveRoom(): string | null {
    return this.currentRoomId;
  }
}

export const readingParlorEngine = new ReadingParlorEngine();

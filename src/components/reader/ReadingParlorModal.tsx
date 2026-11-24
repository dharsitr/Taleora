"use client";

import * as React from "react";
import {
  Users,
  Copy,
  Check,
  X,
  Sparkles,
  Link as LinkIcon,
  Radio,
  LogOut,
  Flame,
} from "lucide-react";
import { readingParlorEngine } from "@/lib/network/parlor-sync";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ReadingParlorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  currentChapterTitle: string;
  onHostSyncToggled?: (isHostSync: boolean) => void;
}

export function ReadingParlorModal({
  isOpen,
  onClose,
  bookTitle,
  currentChapterTitle,
  onHostSyncToggled,
}: ReadingParlorModalProps) {
  const [roomId, setRoomId] = React.useState<string>(() => {
    return readingParlorEngine.getActiveRoom() || `parlor-${Math.random().toString(36).slice(2, 8)}`;
  });
  const [copied, setCopied] = React.useState(false);
  const [isHostSync, setIsHostSync] = React.useState(true);
  const [isConnected, setIsConnected] = React.useState(Boolean(readingParlorEngine.getActiveRoom()));

  if (!isOpen) return null;

  const handleJoinOrCreate = () => {
    if (!roomId.trim()) return;
    readingParlorEngine.joinRoom(roomId.trim());
    setIsConnected(true);
    onHostSyncToggled?.(isHostSync);
  };

  const handleLeave = () => {
    readingParlorEngine.leaveRoom();
    setIsConnected(false);
  };

  const handleCopyLink = () => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("parlor", roomId);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl border border-amber-500/30 bg-[#10131B]/95 backdrop-blur-2xl p-6 shadow-2xl flex flex-col gap-5 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                Synchronized Reading Parlor
              </h3>
              <p className="text-[11px] text-zinc-400">
                Live co-reading room with page lock & reactions
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-white/10 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Current Session Info */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
            Active Story
          </span>
          <p className="text-xs font-serif font-bold text-white truncate">
            {bookTitle}
          </p>
          <span className="text-[11px] text-zinc-400 truncate">
            {currentChapterTitle}
          </span>
        </div>

        {/* Room Code & Share */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-zinc-300">
            Parlor Room Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              disabled={isConnected}
              className="flex-1 px-3.5 py-2 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-1.5 text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-400 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Invite"}</span>
            </Button>
          </div>
        </div>

        {/* Host Sync Toggle */}
        <label className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer hover:bg-white/[0.05]">
          <input
            type="checkbox"
            checked={isHostSync}
            onChange={(e) => {
              setIsHostSync(e.target.checked);
              onHostSyncToggled?.(e.target.checked);
            }}
            className="rounded mt-0.5 accent-amber-500"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">
              Host-Guided Page Synchronization
            </span>
            <span className="text-[10px] text-zinc-400">
              When you turn pages, all guests in the parlor will turn pages in lockstep.
            </span>
          </div>
        </label>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            Cancel
          </Button>

          {isConnected ? (
            <Button
              type="button"
              size="sm"
              onClick={handleLeave}
              className="gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Parlor</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleJoinOrCreate}
              className="gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-md cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Enter Parlor</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

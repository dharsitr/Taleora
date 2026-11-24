"use client";

import * as React from "react";
import {
  readingParlorEngine,
  ParlorReaction,
} from "@/lib/network/parlor-sync";
import { cn } from "@/lib/utils";

const REACTION_EMOJIS = ["💡", "😱", "❤️", "🍷", "👏", "🕯️"];

interface ActiveBubble {
  id: string;
  emoji: string;
  senderName: string;
  leftOffset: number;
}

export function FloatingReactions({
  visible = true,
  userName = "Reader",
}: {
  visible?: boolean;
  userName?: string;
}) {
  const [bubbles, setBubbles] = React.useState<ActiveBubble[]>([]);
  const [isDockOpen, setIsDockOpen] = React.useState(false);

  React.useEffect(() => {
    const unsub = readingParlorEngine.subscribeReactions((reaction: ParlorReaction) => {
      const newBubble: ActiveBubble = {
        id: reaction.id,
        emoji: reaction.emoji,
        senderName: reaction.senderName,
        leftOffset: Math.floor(Math.random() * 50) - 25,
      };

      setBubbles((prev) => [...prev.slice(-12), newBubble]);

      setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id));
      }, 2600);
    });

    return () => unsub();
  }, []);

  if (!visible) return null;

  const handleSend = (emoji: string) => {
    readingParlorEngine.sendReaction(emoji, userName);
  };

  return (
    <>
      {/* Floating Bubbles Canvas on Right Margin */}
      <div className="fixed right-6 sm:right-12 bottom-28 z-40 pointer-events-none select-none overflow-visible w-20 h-64 flex flex-col justify-end items-center">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="absolute flex flex-col items-center animate-parlor-float"
            style={{
              transform: `translateX(${b.leftOffset}px)`,
            }}
          >
            <span className="text-2xl sm:text-3xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
              {b.emoji}
            </span>
            <span className="text-[9px] font-mono text-amber-300/80 bg-black/60 px-1.5 py-0.2 rounded-full border border-amber-500/20 whitespace-nowrap">
              {b.senderName}
            </span>
          </div>
        ))}
      </div>

      {/* Mini Reaction Dock */}
      <div className="fixed right-4 sm:right-6 bottom-20 z-40 flex items-center gap-1 p-1 rounded-full bg-black/75 dark:bg-[#12151D]/90 backdrop-blur-xl border border-white/10 shadow-xl transition-all">
        {isDockOpen ? (
          <div className="flex items-center gap-1 px-1 animate-in fade-in zoom-in-95 duration-150">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSend(emoji)}
                className="w-7 h-7 rounded-full hover:bg-white/10 hover:scale-125 transition-transform flex items-center justify-center text-sm cursor-pointer"
                title={`Send ${emoji}`}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsDockOpen(false)}
              className="w-5 h-5 rounded-full text-zinc-400 hover:text-white text-xs flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsDockOpen(true)}
            className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 flex items-center justify-center text-sm shadow-sm hover:scale-110 transition-transform cursor-pointer"
            title="Open Live Reaction Dock"
          >
            🕯️
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes parlorFloat {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.6);
          }
          20% {
            opacity: 1;
            transform: translateY(0) scale(1.1);
          }
          80% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translateY(-160px) scale(0.85);
          }
        }
        .animate-parlor-float {
          animation: parlorFloat 2.6s cubic-bezier(0.2, 0.8, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}

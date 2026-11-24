"use client";

import * as React from "react";
import { BookOpen, User, MapPin, Sparkles, X, Search, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface DossierEntry {
  id: string;
  name: string;
  type: "character" | "location" | "lore";
  role: string;
  description: string;
  firstAppearedChapter: number;
}

interface CharacterDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  currentChapterNumber: number;
}

const DEFAULT_DOSSIER: DossierEntry[] = [
  {
    id: "1",
    name: "Elena Rostova",
    type: "character",
    role: "The Cartographer of Veridia",
    description: "Former guildmaster apprentice turned rogue archivist. Possesses the copper star-chronometer.",
    firstAppearedChapter: 1,
  },
  {
    id: "2",
    name: "Lord Julian Vance",
    type: "character",
    role: "High Chancellor of Obsidian",
    description: "Patron of the astronomical society whose true allegiances remain clouded by silence.",
    firstAppearedChapter: 1,
  },
  {
    id: "3",
    name: "The Gilded Spire",
    type: "location",
    role: "Central Astronomical Tower",
    description: "The highest parapet in Veridia where clockwork bells ring hours not found on conventional sundials.",
    firstAppearedChapter: 1,
  },
  {
    id: "4",
    name: "The Black Orchid Vow",
    type: "lore",
    role: "Secret Covenant",
    description: "A centuries-old blood oath binding the noble houses to protect the celestial star charts.",
    firstAppearedChapter: 2,
  },
];

export function CharacterDossierModal({
  isOpen,
  onClose,
  bookTitle,
  currentChapterNumber,
}: CharacterDossierModalProps) {
  const [search, setSearch] = React.useState("");
  const [filterType, setFilterType] = React.useState<"all" | "character" | "location" | "lore">("all");

  if (!isOpen) return null;

  const filtered = DEFAULT_DOSSIER.filter((entry) => {
    const matchesSearch =
      entry.name.toLowerCase().includes(search.toLowerCase()) ||
      entry.role.toLowerCase().includes(search.toLowerCase()) ||
      entry.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || entry.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-amber-500/30 bg-[#10131B]/95 backdrop-blur-2xl p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-white">
                Taleora Lore Lexicon & Personae
              </h3>
              <p className="text-[11px] text-zinc-400">
                Spoiler-protected character dossiers & world encyclopedia
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

        {/* Search & Filter pills */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search personae or lore..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center p-0.5 rounded-xl bg-white/[0.04] border border-white/10 text-[11px]">
            {(["all", "character", "location", "lore"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-2.5 py-1 rounded-lg capitalize transition-colors cursor-pointer font-medium",
                  filterType === t
                    ? "bg-amber-500 text-stone-950 font-bold"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* List of Dossiers */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.map((d) => {
            const isFuture = d.firstAppearedChapter > currentChapterNumber;
            return (
              <div
                key={d.id}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-1.5 transition-all hover:border-amber-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-xs">
                      {d.type === "character" ? "👤" : d.type === "location" ? "📍" : "📜"}
                    </span>
                    <span className="font-serif font-bold text-sm text-white">
                      {d.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                    Ch. {d.firstAppearedChapter}
                  </span>
                </div>

                <p className="text-[11px] font-mono font-medium text-amber-400/90">
                  {d.role}
                </p>

                <p className="text-xs text-zinc-300 font-serif leading-relaxed">
                  {d.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

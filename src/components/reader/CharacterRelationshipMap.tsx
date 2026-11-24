"use client";

import * as React from "react";
import { GitFork, Network, Sparkles, Filter, X, ShieldAlert, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface CharacterNode {
  id: string;
  name: string;
  role: string;
  faction: "scholars" | "royalty" | "rebels" | "neutral";
  x: number;
  y: number;
  firstChapter: number;
}

export interface CharacterLink {
  source: string;
  target: string;
  relation: string;
  revealedInChapter: number;
  type: "ally" | "rival" | "secret" | "mentor";
}

const NODES: CharacterNode[] = [
  { id: "elena", name: "Elena Rostova", role: "Archivist / Cartographer", faction: "scholars", x: 220, y: 140, firstChapter: 1 },
  { id: "julian", name: "Lord Julian Vance", role: "High Chancellor", faction: "royalty", x: 450, y: 100, firstChapter: 1 },
  { id: "koren", name: "Koren Blackwood", role: "Rogue Spy / Shadow", faction: "rebels", x: 340, y: 300, firstChapter: 2 },
  { id: "selene", name: "Grand Astrologer Selene", role: "Gilded Spire Oracle", faction: "scholars", x: 120, y: 280, firstChapter: 1 },
  { id: "marius", name: "General Marius Cole", role: "Iron Vanguard Commander", faction: "royalty", x: 540, y: 260, firstChapter: 3 },
];

const LINKS: CharacterLink[] = [
  { source: "elena", target: "julian", relation: "Tense Patronage", revealedInChapter: 1, type: "ally" },
  { source: "elena", target: "selene", relation: "Former Apprentice", revealedInChapter: 1, type: "mentor" },
  { source: "koren", target: "julian", relation: "Secret Nemesis", revealedInChapter: 2, type: "rival" },
  { source: "elena", target: "koren", relation: "Clandestine Informant", revealedInChapter: 2, type: "secret" },
  { source: "marius", target: "julian", relation: "Military Enforcer", revealedInChapter: 3, type: "ally" },
];

const FACTION_COLORS = {
  scholars: { stroke: "#38bdf8", fill: "rgba(56, 189, 248, 0.15)", text: "text-sky-400", label: "Scholars of Veridia" },
  royalty: { stroke: "#fbbf24", fill: "rgba(251, 191, 36, 0.15)", text: "text-amber-400", label: "High Chancellor's Court" },
  rebels: { stroke: "#f43f5e", fill: "rgba(244, 63, 94, 0.15)", text: "text-rose-400", label: "Midnight Concord" },
  neutral: { stroke: "#94a3b8", fill: "rgba(148, 163, 184, 0.15)", text: "text-slate-400", label: "Unaffiliated" },
};

const RELATION_COLORS = {
  ally: "#38bdf8",
  rival: "#f43f5e",
  secret: "#c084fc",
  mentor: "#34d399",
};

interface CharacterRelationshipMapProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  currentChapterNumber: number;
}

export function CharacterRelationshipMap({
  isOpen,
  onClose,
  bookTitle,
  currentChapterNumber,
}: CharacterRelationshipMapProps) {
  const [selectedChapter, setSelectedChapter] = React.useState(currentChapterNumber);
  const [selectedNode, setSelectedNode] = React.useState<CharacterNode | null>(null);

  if (!isOpen) return null;

  // Filter nodes & links by spoiler ceiling (only show what was revealed by selectedChapter)
  const visibleNodes = NODES.filter((n) => n.firstChapter <= selectedChapter);
  const visibleLinks = LINKS.filter(
    (l) =>
      l.revealedInChapter <= selectedChapter &&
      visibleNodes.some((n) => n.id === l.source) &&
      visibleNodes.some((n) => n.id === l.target)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-card/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Character Relationship Graph
              </h2>
              <p className="text-xs text-muted-foreground">
                {bookTitle} · Dynamic Lore & Faction Web
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chapter Slider / Spoiler Scrubbing */}
        <div className="px-6 py-3 border-b border-border/70 bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Lore Revealed Through: <strong className="text-primary font-bold">Chapter {selectedChapter}</strong></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
            <span className="text-[10px] text-muted-foreground">Ch. 1</span>
            <input
              type="range"
              min="1"
              max={Math.max(3, currentChapterNumber)}
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <span className="text-[10px] text-muted-foreground">Ch. {Math.max(3, currentChapterNumber)}</span>
          </div>
        </div>

        {/* SVG Graph Canvas */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-zinc-950 p-4 overflow-hidden flex items-center justify-center">
          <svg className="w-full h-full min-h-[400px] select-none" viewBox="0 0 680 400">
            {/* Background grid */}
            <defs>
              <pattern id="graph-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.04)" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-grid)" />

            {/* Links */}
            {visibleLinks.map((link, idx) => {
              const src = visibleNodes.find((n) => n.id === link.source);
              const tgt = visibleNodes.find((n) => n.id === link.target);
              if (!src || !tgt) return null;
              const midX = (src.x + tgt.x) / 2;
              const midY = (src.y + tgt.y) / 2;
              const color = RELATION_COLORS[link.type] || "#94a3b8";

              return (
                <g key={idx} className="transition-all duration-300">
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke={color}
                    strokeWidth="2"
                    strokeDasharray={link.type === "secret" ? "4 4" : "0"}
                    strokeOpacity="0.75"
                  />
                  {/* Relation label pill */}
                  <rect
                    x={midX - 45}
                    y={midY - 10}
                    width="90"
                    height="20"
                    rx="10"
                    fill="#18181b"
                    stroke={color}
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill="#e4e4e7"
                    fontSize="9"
                    fontFamily="serif"
                  >
                    {link.relation}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {visibleNodes.map((node) => {
              const faction = FACTION_COLORS[node.faction];
              const isSelected = selectedNode?.id === node.id;

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer group"
                >
                  <circle
                    r={isSelected ? "28" : "24"}
                    fill={faction.fill}
                    stroke={faction.stroke}
                    strokeWidth={isSelected ? "3" : "2"}
                    className="transition-all duration-200 group-hover:scale-110"
                  />
                  <circle r="4" fill={faction.stroke} />
                  <text
                    y="38"
                    textAnchor="middle"
                    fill="#f4f4f5"
                    fontSize="11"
                    fontWeight="bold"
                    fontFamily="serif"
                    className="drop-shadow-md select-none"
                  >
                    {node.name}
                  </text>
                  <text
                    y="50"
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="8"
                    fontFamily="sans-serif"
                    className="select-none"
                  >
                    {node.role}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Node Inspector Drawer */}
          {selectedNode && (
            <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-background/95 border border-border p-4 rounded-2xl shadow-xl backdrop-blur-md animate-in slide-in-from-bottom duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-foreground">{selectedNode.name}</h4>
                  <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">
                    {FACTION_COLORS[selectedNode.faction].label}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                First emerged in Chapter {selectedNode.firstChapter}. Role: {selectedNode.role}.
              </p>
            </div>
          )}
        </div>

        {/* Faction Legend */}
        <div className="p-3 sm:p-4 border-t border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(FACTION_COLORS).map(([key, item]) => (
              <div key={key} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.stroke }} />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground italic">
            Click any character node to inspect alliances
          </span>
        </div>
      </div>
    </div>
  );
}

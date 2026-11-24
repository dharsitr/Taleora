"use client";

import * as React from "react";
import {
  Sparkles,
  X,
  Check,
  Palette,
  Type,
  Shield,
  Download,
  UploadCloud,
  Layers,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LuxuryCoverGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  authorName?: string;
  onApplyCover: (coverUrl: string, gradient: string, accent: string) => void;
}

interface PaletteTheme {
  name: string;
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  foil: "gold" | "silver" | "bronze";
  gradientClass: string;
}

const LUXURY_PALETTES: PaletteTheme[] = [
  {
    name: "Imperial Amber & Onyx",
    bgStart: "#451A03",
    bgMid: "#1C1917",
    bgEnd: "#0C0A09",
    accent: "#F59E0B",
    foil: "gold",
    gradientClass: "from-amber-900 via-stone-900 to-black",
  },
  {
    name: "Midnight Obsidian",
    bgStart: "#0F172A",
    bgMid: "#090D16",
    bgEnd: "#020617",
    accent: "#38BDF8",
    foil: "silver",
    gradientClass: "from-slate-900 via-zinc-950 to-black",
  },
  {
    name: "Verdant Emerald",
    bgStart: "#064E3B",
    bgMid: "#022C22",
    bgEnd: "#051A14",
    accent: "#34D399",
    foil: "gold",
    gradientClass: "from-emerald-950 via-teal-950 to-black",
  },
  {
    name: "Royal Amethyst",
    bgStart: "#3B0764",
    bgMid: "#1E1B4B",
    bgEnd: "#0F0A1C",
    accent: "#C084FC",
    foil: "silver",
    gradientClass: "from-purple-950 via-indigo-950 to-black",
  },
  {
    name: "Crimson Rosewood",
    bgStart: "#4C0519",
    bgMid: "#1C1917",
    bgEnd: "#09090B",
    accent: "#FB7185",
    foil: "bronze",
    gradientClass: "from-rose-950 via-stone-950 to-black",
  },
];

const FONTS = [
  { id: "Cinzel", label: "Cinzel Classical", serif: true },
  { id: "Playfair Display", label: "Playfair Literary", serif: true },
  { id: "Georgia", label: "Georgia Editorial", serif: true },
];

export function LuxuryCoverGeneratorModal({
  isOpen,
  onClose,
  title,
  subtitle,
  authorName = "Taleora Author",
  onApplyCover,
}: LuxuryCoverGeneratorModalProps) {
  const [selectedPalette, setSelectedPalette] = React.useState<PaletteTheme>(
    LUXURY_PALETTES[0]
  );
  const [selectedFont, setSelectedFont] = React.useState(FONTS[0].id);
  const [hasFoilBorder, setHasFoilBorder] = React.useState(true);
  const [hasCornerOrnaments, setHasCornerOrnaments] = React.useState(true);
  const [badgeText, setBadgeText] = React.useState("FIRST EDITION");
  const [isGenerating, setIsGenerating] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // Redraw canvas whenever settings change
  const renderCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 600;
    const height = 900;
    canvas.width = width;
    canvas.height = height;

    // 1. Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, selectedPalette.bgStart);
    bgGrad.addColorStop(0.5, selectedPalette.bgMid);
    bgGrad.addColorStop(1, selectedPalette.bgEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle Grain / Noise Overlay
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 14;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Book Spine Shadow on left
    const spineGrad = ctx.createLinearGradient(0, 0, 36, 0);
    spineGrad.addColorStop(0, "rgba(0, 0, 0, 0.7)");
    spineGrad.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
    spineGrad.addColorStop(0.8, "rgba(0, 0, 0, 0.45)");
    spineGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(0, 0, 36, height);

    // 4. Metallic Foil Borders
    if (hasFoilBorder) {
      const foilColor =
        selectedPalette.foil === "gold"
          ? "#F59E0B"
          : selectedPalette.foil === "silver"
          ? "#E2E8F0"
          : "#FB923C";

      ctx.strokeStyle = foilColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(32, 32, width - 64, height - 64);

      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 40, width - 80, height - 80);

      // Corner Ornaments
      if (hasCornerOrnaments) {
        ctx.fillStyle = foilColor;
        const cornerSize = 12;
        // Top-left
        ctx.fillRect(44, 44, cornerSize, 2);
        ctx.fillRect(44, 44, 2, cornerSize);
        // Top-right
        ctx.fillRect(width - 44 - cornerSize, 44, cornerSize, 2);
        ctx.fillRect(width - 46, 44, 2, cornerSize);
        // Bottom-left
        ctx.fillRect(44, height - 46, cornerSize, 2);
        ctx.fillRect(44, height - 44 - cornerSize, 2, cornerSize);
        // Bottom-right
        ctx.fillRect(width - 44 - cornerSize, height - 46, cornerSize, 2);
        ctx.fillRect(width - 46, height - 44 - cornerSize, 2, cornerSize);
      }
    }

    // 5. Publisher Header
    ctx.textAlign = "center";
    ctx.fillStyle = selectedPalette.accent;
    ctx.font = "600 13px 'JetBrains Mono', monospace";
    ctx.fillText("✦  T A L E O R A   P R E S S  ✦", width / 2, 85);

    // 6. Title (Auto-wrapping serif)
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 38px '${selectedFont}', Georgia, serif`;
    const storyTitle = title || "Untitled Novella";

    // Simple word wrapping
    const words = storyTitle.split(" ");
    let line = "";
    const lines: string[] = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > width - 130 && n > 0) {
        lines.push(line.trim());
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    const startY = height / 2 - lines.length * 26 - 20;
    lines.forEach((l, idx) => {
      ctx.fillText(l, width / 2, startY + idx * 48);
    });

    // Decorative divider line
    const dividerY = startY + lines.length * 48 + 15;
    ctx.strokeStyle = selectedPalette.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 40, dividerY);
    ctx.lineTo(width / 2 + 40, dividerY);
    ctx.stroke();

    // 7. Subtitle
    if (subtitle) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.font = `italic 16px '${selectedFont}', Georgia, serif`;
      ctx.fillText(subtitle, width / 2, dividerY + 36);
    }

    // 8. Author Name
    ctx.fillStyle = selectedPalette.accent;
    ctx.font = `600 18px '${selectedFont}', Georgia, serif`;
    ctx.fillText(authorName, width / 2, height - 120);

    // 9. Badge Ribbon at bottom
    if (badgeText) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "500 11px 'JetBrains Mono', monospace";
      ctx.fillText(badgeText.toUpperCase(), width / 2, height - 70);
    }
  }, [
    selectedPalette,
    selectedFont,
    hasFoilBorder,
    hasCornerOrnaments,
    badgeText,
    title,
    subtitle,
    authorName,
  ]);

  React.useEffect(() => {
    if (isOpen) {
      // Delay to ensure fonts and canvas are mounted
      const timer = setTimeout(renderCanvas, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, renderCanvas]);

  if (!isOpen) return null;

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    try {
      const dataUrl = canvas.toDataURL("image/png");
      onApplyCover(dataUrl, selectedPalette.gradientClass, selectedPalette.accent);
      onClose();
    } catch (err) {
      console.error("Cover generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl border border-white/15 dark:border-white/10 bg-card/95 dark:bg-[#12151D]/95 backdrop-blur-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Luxury Cover Art Studio
              </h2>
              <p className="text-xs text-muted-foreground">
                Generate high-resolution foil-embossed hardcover artwork with 1 click
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border/70 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col md:flex-row gap-6 items-center md:items-start justify-center">
          {/* Left: 3D Cover Live Canvas */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="relative p-2 rounded-2xl bg-black/40 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_20px_rgba(245,158,11,0.15)] group">
              <canvas
                ref={canvasRef}
                className="w-[220px] h-[330px] sm:w-[260px] sm:h-[390px] rounded-xl shadow-2xl object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              />
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              600 × 900 Hi-Res Canvas Preview
            </span>
          </div>

          {/* Right: Customization Controls */}
          <div className="flex-1 flex flex-col gap-4 w-full">
            {/* Palette Presets */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-500" />
                Color Atmosphere
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LUXURY_PALETTES.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSelectedPalette(p)}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-xl border text-left text-xs transition-all cursor-pointer",
                      selectedPalette.name === p.name
                        ? "border-amber-500 bg-amber-500/10 shadow-xs"
                        : "border-border/70 bg-card hover:bg-secondary/60"
                    )}
                  >
                    <span
                      className="w-5 h-5 rounded-lg border border-white/20 shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${p.bgStart}, ${p.bgEnd})`,
                      }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-foreground truncate">
                        {p.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground capitalize">
                        {p.foil} Foil
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-500" />
                Cover Typography
              </label>
              <div className="flex flex-wrap gap-2">
                {FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFont(f.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-serif transition-all cursor-pointer",
                      selectedFont === f.id
                        ? "border-amber-500 bg-amber-500/10 text-amber-400 font-bold"
                        : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Foil Finishes & Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card cursor-pointer hover:bg-secondary/40">
                <input
                  type="checkbox"
                  checked={hasFoilBorder}
                  onChange={(e) => setHasFoilBorder(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span className="text-xs text-foreground font-medium">
                  Metallic Foil Border
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/70 bg-card cursor-pointer hover:bg-secondary/40">
                <input
                  type="checkbox"
                  checked={hasCornerOrnaments}
                  onChange={(e) => setHasCornerOrnaments(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span className="text-xs text-foreground font-medium">
                  Corner Ornaments
                </span>
              </label>
            </div>

            {/* Badge Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-muted-foreground">
                Ribbon / Badge Text
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. FIRST EDITION, LIMITED, A TALEORA NOVELLA"
                className="w-full px-3 py-1.5 rounded-xl border border-input bg-background text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border/60 bg-card/60">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleApply}
            disabled={isGenerating}
            className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold shadow-md cursor-pointer"
          >
            <Wand2 className="w-4 h-4" />
            <span>Apply Cover to Story</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

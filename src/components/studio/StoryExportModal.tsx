"use client";

import * as React from "react";
import { Download, BookOpen, FileText, Check, Sparkles, X, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ChapterRow } from "@/types/books";
import { cn } from "@/lib/utils";

interface StoryExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookTitle: string;
  authorName: string;
  chapters: ChapterRow[];
}

export function StoryExportModal({
  isOpen,
  onClose,
  bookTitle,
  authorName,
  chapters,
}: StoryExportModalProps) {
  const [format, setFormat] = React.useState<"epub" | "html" | "txt">("epub");
  const [includeCover, setIncludeCover] = React.useState(true);
  const [isExporting, setIsExporting] = React.useState(false);
  const [downloadReady, setDownloadReady] = React.useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);

    setTimeout(() => {
      let content = "";
      let mimeType = "text/plain";
      let ext = "txt";

      if (format === "txt") {
        content = `${bookTitle.toUpperCase()}\nBy ${authorName}\n\n====================\n\n` +
          chapters
            .map((c) => `CHAPTER ${c.chapter_number}: ${c.title}\n\n${c.content || "(No content)"}\n\n`)
            .join("\n---\n\n");
        mimeType = "text/plain";
        ext = "txt";
      } else if (format === "html") {
        content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${bookTitle}</title>
  <style>
    body { font-family: 'Georgia', serif; line-height: 1.8; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #222; }
    h1 { text-align: center; margin-bottom: 5px; }
    .author { text-align: center; color: #666; font-style: italic; margin-bottom: 40px; }
    .chapter { page-break-before: always; margin-top: 60px; }
    h2 { border-bottom: 1px solid #ddd; padding-bottom: 8px; }
  </style>
</head>
<body>
  <h1>${bookTitle}</h1>
  <div class="author">By ${authorName}</div>
  ${chapters
    .map(
      (c) => `
    <div class="chapter">
      <h2>Chapter ${c.chapter_number}: ${c.title}</h2>
      <div>${(c.content || "").replace(/\n\n/g, "</p><p>")}</div>
    </div>`
    )
    .join("\n")}
</body>
</html>`;
        mimeType = "text/html";
        ext = "html";
      } else {
        // EPUB packaging bundle simulation (DRM-Free XML/MIME format)
        content = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${bookTitle}</dc:title>
    <dc:creator>${authorName}</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    ${chapters.map((c, i) => `<item id="ch${i}" href="chapter_${i + 1}.xhtml" media-type="application/xhtml+xml"/>`).join("\n    ")}
  </manifest>
  <spine>
    ${chapters.map((c, i) => `<itemref idref="ch${i}"/>`).join("\n    ")}
  </spine>
</package>`;
        mimeType = "application/epub+zip";
        ext = "epub";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bookTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
      setDownloadReady(true);
      setTimeout(() => setDownloadReady(false), 3000);
    }, 600);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-card/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                Export &amp; Download Book
              </h2>
              <p className="text-xs text-muted-foreground">
                DRM-Free package for Kindle, Kobo, Apple Books, and Print
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

        {/* Export Body */}
        <div className="p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Select Package Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat("epub")}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                  format === "epub"
                    ? "bg-primary/15 border-primary text-primary"
                    : "border-border hover:bg-secondary text-muted-foreground"
                )}
              >
                <BookOpen className="w-5 h-5" />
                <span className="text-xs font-bold">Standard EPUB</span>
                <span className="text-[9px] opacity-70">E-readers</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("html")}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                  format === "html"
                    ? "bg-primary/15 border-primary text-primary"
                    : "border-border hover:bg-secondary text-muted-foreground"
                )}
              >
                <Printer className="w-5 h-5" />
                <span className="text-xs font-bold">Printable HTML</span>
                <span className="text-[9px] opacity-70">Web &amp; PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat("txt")}
                className={cn(
                  "p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
                  format === "txt"
                    ? "bg-primary/15 border-primary text-primary"
                    : "border-border hover:bg-secondary text-muted-foreground"
                )}
              >
                <FileText className="w-5 h-5" />
                <span className="text-xs font-bold">Plain Text</span>
                <span className="text-[9px] opacity-70">Raw Prose</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/40 border border-border text-xs flex items-center justify-between">
            <span className="text-muted-foreground">Chapters included:</span>
            <span className="font-bold text-foreground">{chapters.length} chapters</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-border flex items-center justify-between bg-card/60">
          <Button variant="ghost" size="sm" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isExporting}
            onClick={handleExport}
            className="gap-2 cursor-pointer shadow-md"
          >
            {downloadReady ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isExporting ? "Generating..." : "Download Package"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Upload,
  BookOpen,
  X,
  Sparkles,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  parseEpubBuffer,
  parseMarkdownManuscript,
  type ParsedStoryBook,
} from "@/lib/books/epub-parser";

interface EpubIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (bookSlug: string) => void;
}

type IngestStage = "upload" | "parsing" | "review" | "publishing" | "success";

export function EpubIngestModal({
  isOpen,
  onClose,
  onSuccess,
}: EpubIngestModalProps) {
  const [stage, setStage] = React.useState<IngestStage>("upload");
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [publishProgress, setPublishProgress] = React.useState<string>("");

  // Parsed book state
  const [parsedBook, setParsedBook] = React.useState<ParsedStoryBook | null>(null);

  // Editable fields in review stage
  const [editedTitle, setEditedTitle] = React.useState("");
  const [editedSubtitle, setEditedSubtitle] = React.useState("");
  const [editedDescription, setEditedDescription] = React.useState("");
  const [expandedChapterIdx, setExpandedChapterIdx] = React.useState<number | null>(null);

  // Success state
  const [createdBook, setCreatedBook] = React.useState<{
    id: string;
    slug: string;
    title: string;
    totalChapters: number;
  } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Reset state when closed
  React.useEffect(() => {
    if (!isOpen) {
      setStage("upload");
      setParsedBook(null);
      setErrorMessage(null);
      setPublishProgress("");
      setCreatedBook(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle file reading
  const processFile = async (file: File) => {
    setErrorMessage(null);
    setStage("parsing");

    try {
      const fileName = file.name.toLowerCase();
      const isEpub = fileName.endsWith(".epub");
      const isMarkdown = fileName.endsWith(".md") || fileName.endsWith(".markdown");
      const isText = fileName.endsWith(".txt");

      if (!isEpub && !isMarkdown && !isText) {
        throw new Error(
          "Unsupported format. Please upload an EPUB (.epub), Markdown (.md), or Plain Text (.txt) file."
        );
      }

      if (isEpub) {
        const arrayBuffer = await file.arrayBuffer();
        const bookData = await parseEpubBuffer(arrayBuffer);
        setParsedBook(bookData);
        setEditedTitle(bookData.title);
        setEditedSubtitle(bookData.subtitle);
        setEditedDescription(bookData.description);
        setStage("review");
      } else {
        const text = await file.text();
        const baseTitle = file.name.replace(/\.[^/.]+$/, "");
        const bookData = parseMarkdownManuscript(text, baseTitle);
        setParsedBook(bookData);
        setEditedTitle(bookData.title);
        setEditedSubtitle(bookData.subtitle);
        setEditedDescription(bookData.description);
        setStage("review");
      }
    } catch (err: unknown) {
      console.error("File parsing error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to extract content from file."
      );
      setStage("upload");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePublish = async () => {
    if (!parsedBook) return;
    setStage("publishing");
    setErrorMessage(null);
    setPublishProgress("Uploading cover & establishing story record...");

    try {
      const payload = {
        title: editedTitle.trim(),
        subtitle: editedSubtitle.trim() || null,
        description: editedDescription.trim() || null,
        coverDataUrl: parsedBook.coverDataUrl || null,
        chapters: parsedBook.chapters,
        status: "published",
      };

      setPublishProgress("Publishing chapters to Supabase database...");

      const res = await fetch("/api/studio/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || data.error || "Failed to import story.");
      }

      setCreatedBook(data.book);
      setStage("success");
      if (onSuccess && data.book?.slug) {
        onSuccess(data.book.slug);
      }
    } catch (err: unknown) {
      console.error("Publishing error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to publish story to catalog."
      );
      setStage("review");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl border border-white/15 dark:border-white/10 bg-card/95 dark:bg-[#12151D]/95 backdrop-blur-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-foreground">
                One-Click Story Ingestor
              </h2>
              <p className="text-xs text-muted-foreground">
                Instantly import any EPUB, Markdown, or Text manuscript into your library
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-border/70 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STAGE 1: Upload Dropzone */}
          {stage === "upload" && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-4 p-8 sm:p-14 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${
                isDragOver
                  ? "border-amber-500 bg-amber-500/10 scale-[1.01]"
                  : "border-border/80 hover:border-amber-500/50 hover:bg-secondary/40"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".epub,.md,.markdown,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Upload className="w-8 h-8 text-amber-500" />
              </div>

              <div className="flex flex-col gap-1 max-w-sm">
                <p className="font-serif text-base font-bold text-foreground">
                  Drag and drop your manuscript here
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports <strong className="text-foreground">.epub</strong>,{" "}
                  <strong className="text-foreground">.md</strong>, and{" "}
                  <strong className="text-foreground">.txt</strong> files
                </p>
              </div>

              <Button
                size="md"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl mt-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <span>Browse Files</span>
              </Button>
            </div>
          )}

          {/* STAGE 2: Parsing Spinner */}
          {stage === "parsing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin" />
              <div className="flex flex-col gap-1">
                <p className="font-serif text-lg font-bold text-foreground">
                  Extracting Story Architecture...
                </p>
                <p className="text-xs text-muted-foreground">
                  Decompressing chapters, parsing cover art, and computing reading metrics
                </p>
              </div>
            </div>
          )}

          {/* STAGE 3: Review & Edit Preview */}
          {stage === "review" && parsedBook && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                {/* Cover Preview */}
                <div className="sm:col-span-4 flex flex-col items-center gap-2">
                  <div className="relative w-36 h-52 sm:w-44 sm:h-64 rounded-xl overflow-hidden shadow-2xl border border-white/20 bg-gradient-to-br from-amber-700 via-stone-800 to-zinc-950 flex flex-col justify-between p-3.5 text-white">
                    {parsedBook.coverDataUrl ? (
                      <Image
                        src={parsedBook.coverDataUrl}
                        alt="Extracted Cover"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-2.5 book-spine-shadow z-10" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
                          Taleora Edition
                        </span>
                        <p className="font-serif text-sm font-bold line-clamp-3">
                          {editedTitle || "Story Title"}
                        </p>
                        <span className="text-[10px] text-amber-200/80 font-serif italic">
                          {parsedBook.authorName}
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {parsedBook.coverDataUrl ? "✓ Extracted Cover Art" : "Aesthetic Gradient Cover"}
                  </span>
                </div>

                {/* Story Metadata Inputs */}
                <div className="sm:col-span-8 flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Story Title
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Subtitle / Author Tag
                    </label>
                    <input
                      type="text"
                      value={editedSubtitle}
                      onChange={(e) => setEditedSubtitle(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Description / Synopsis
                    </label>
                    <textarea
                      rows={3}
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      placeholder="Add a brief synopsis for readers..."
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
                    />
                  </div>

                  {/* Metrics Badge Rail */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant="warm" className="gap-1.5 text-xs py-1 px-3">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{parsedBook.chapters.length} Chapters</span>
                    </Badge>
                    <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-3">
                      <FileText className="w-3.5 h-3.5" />
                      <span>{parsedBook.totalWords.toLocaleString()} words</span>
                    </Badge>
                    <Badge variant="secondary" className="gap-1.5 text-xs py-1 px-3">
                      <Clock className="w-3.5 h-3.5" />
                      <span>~{parsedBook.totalEstimatedMinutes} min read</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Chapter Table of Contents Accordion */}
              <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Detected Chapters ({parsedBook.chapters.length})
                </span>

                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {parsedBook.chapters.map((ch, idx) => {
                    const isExpanded = expandedChapterIdx === idx;
                    return (
                      <div
                        key={idx}
                        className="rounded-xl border border-border/70 bg-secondary/30 overflow-hidden text-xs"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedChapterIdx(isExpanded ? null : idx)}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-secondary/60 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-500">
                              #{ch.chapterNumber}
                            </span>
                            <span className="font-semibold text-foreground truncate max-w-md">
                              {ch.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-muted-foreground shrink-0">
                            <span>{ch.wordCount.toLocaleString()} words</span>
                            <span>·</span>
                            <span>~{ch.estimatedReadMinutes}m</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-3 border-t border-border/50 bg-background/50 font-serif text-muted-foreground text-[11px] leading-relaxed max-h-32 overflow-y-auto">
                            {ch.content.slice(0, 300)}...
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4: Publishing Progress */}
          {stage === "publishing" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-12 h-12 rounded-full border-3 border-amber-500/30 border-t-amber-500 animate-spin" />
              <div className="flex flex-col gap-1">
                <p className="font-serif text-lg font-bold text-foreground">
                  Importing to Supabase...
                </p>
                <p className="text-xs text-amber-500 font-medium animate-pulse">
                  {publishProgress}
                </p>
              </div>
            </div>
          )}

          {/* STAGE 5: Success Celebration */}
          {stage === "success" && createdBook && (
            <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="flex flex-col gap-1.5 max-w-md">
                <h3 className="font-serif text-2xl font-bold text-foreground">
                  Story Successfully Published!
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">{createdBook.title}</strong> is now live in
                  your library with all {createdBook.totalChapters} chapters formatted for the 3D
                  reader.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full justify-center">
                <Link
                  href={`/read/${createdBook.slug}`}
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-11 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 text-white font-bold cursor-pointer gap-2 shadow-xl shadow-amber-500/25"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Open in 3D Reader</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link
                  href={`/books/${createdBook.slug}`}
                  onClick={onClose}
                  className="w-full sm:w-auto"
                >
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-11 px-6 rounded-xl border-border bg-secondary/50 hover:bg-secondary cursor-pointer"
                  >
                    <span>View Book Details</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {stage === "review" && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-t border-border/60 bg-secondary/20">
            <Button
              variant="ghost"
              size="md"
              onClick={() => {
                setStage("upload");
                setParsedBook(null);
              }}
              className="text-xs cursor-pointer"
            >
              <span>Back / Choose Another File</span>
            </Button>

            <Button
              size="md"
              onClick={handlePublish}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 text-white font-bold cursor-pointer shadow-xl shadow-amber-500/20 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Import & Publish to Catalog</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

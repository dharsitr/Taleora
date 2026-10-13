"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    console.error("Unhandled App Router Error:", error);
  }, [error]);

  const isNetworkError =
    error?.message?.toLowerCase().includes("fetch") ||
    error?.message?.toLowerCase().includes("network") ||
    (typeof navigator !== "undefined" && !navigator.onLine);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-12 max-w-lg mx-auto">
      {/* Radiant Amber Warning Halo */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
          <AlertCircle className="w-10 h-10 text-amber-400" />
        </div>
        <div className="absolute -inset-4 bg-amber-500/10 rounded-full blur-2xl -z-10 pointer-events-none" />
      </div>

      <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-semibold mb-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25">
        {isNetworkError ? "Connection Notice" : "Application Notice"}
      </span>

      <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
        {isNetworkError ? "Quiet In The Archives" : "Unable to Load Page"}
      </h1>

      <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md">
        {isNetworkError
          ? "This page requires an active internet connection to load fresh records from Taleora. Your offline downloaded books remain safely accessible."
          : "An unexpected glitch occurred while rendering this page. You can retry the request or return to your library sanctuary."}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          onClick={() => reset()}
          className="gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold border-none shadow-md shadow-amber-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </Button>

        <Link href="/library">
          <Button variant="outline" className="gap-2 border-border/80 hover:border-amber-500/40 text-foreground">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Go to My Library</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

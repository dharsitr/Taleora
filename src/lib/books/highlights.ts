import { HighlightColor, HighlightRow } from "@/types/books";

export interface HighlightColorConfig {
  key: HighlightColor;
  name: string;
  badgeClass: string;
  markClass: string;
  dotColor: string;
  previewBg: string;
}

export const HIGHLIGHT_COLORS: Record<HighlightColor, HighlightColorConfig> = {
  amber: {
    key: "amber",
    name: "Golden Honey",
    badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700/50",
    markClass:
      "bg-amber-200/75 dark:bg-amber-500/30 text-inherit border-b-2 border-amber-400/80 dark:border-amber-500/70 hover:bg-amber-300/80 transition-colors cursor-pointer rounded-xs px-0.5",
    dotColor: "bg-amber-400 dark:bg-amber-500",
    previewBg: "bg-amber-400",
  },
  emerald: {
    key: "emerald",
    name: "Verdant Green",
    badgeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50",
    markClass:
      "bg-emerald-200/75 dark:bg-emerald-500/30 text-inherit border-b-2 border-emerald-400/80 dark:border-emerald-500/70 hover:bg-emerald-300/80 transition-colors cursor-pointer rounded-xs px-0.5",
    dotColor: "bg-emerald-400 dark:bg-emerald-500",
    previewBg: "bg-emerald-500",
  },
  sky: {
    key: "sky",
    name: "Cerulean Blue",
    badgeClass: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300 dark:border-sky-700/50",
    markClass:
      "bg-sky-200/75 dark:bg-sky-500/30 text-inherit border-b-2 border-sky-400/80 dark:border-sky-500/70 hover:bg-sky-300/80 transition-colors cursor-pointer rounded-xs px-0.5",
    dotColor: "bg-sky-400 dark:bg-sky-500",
    previewBg: "bg-sky-400",
  },
  rose: {
    key: "rose",
    name: "Blush Rose",
    badgeClass: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700/50",
    markClass:
      "bg-rose-200/75 dark:bg-rose-500/30 text-inherit border-b-2 border-rose-400/80 dark:border-rose-500/70 hover:bg-rose-300/80 transition-colors cursor-pointer rounded-xs px-0.5",
    dotColor: "bg-rose-400 dark:bg-rose-500",
    previewBg: "bg-rose-400",
  },
  violet: {
    key: "violet",
    name: "Royal Amethyst",
    badgeClass: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700/50",
    markClass:
      "bg-purple-200/75 dark:bg-purple-500/30 text-inherit border-b-2 border-purple-400/80 dark:border-purple-500/70 hover:bg-purple-300/80 transition-colors cursor-pointer rounded-xs px-0.5",
    dotColor: "bg-purple-400 dark:bg-purple-500",
    previewBg: "bg-purple-400",
  },
};

export interface TextFragment {
  text: string;
  highlight?: HighlightRow;
}

/**
 * Splits paragraph text into plain slices and highlighted slices for rendering.
 * Safely guards against overlapping highlights or offset mismatches.
 */
export function parseParagraphHighlights(
  paragraphText: string,
  highlights: HighlightRow[]
): TextFragment[] {
  if (!highlights || highlights.length === 0) {
    return [{ text: paragraphText }];
  }

  // Resolve offsets for each highlight (validating with selected_text if offsets drifted)
  interface ResolvedHighlight {
    highlight: HighlightRow;
    start: number;
    end: number;
  }

  const resolved: ResolvedHighlight[] = [];

  for (const h of highlights) {
    if (!h.selected_text) continue;

    let start = h.start_offset;
    let end = h.end_offset;
    let isMatch = false;

    // 1. Direct offset check
    if (start >= 0 && end <= paragraphText.length && end > start) {
      const sliceAtOffset = paragraphText.slice(start, end);
      if (sliceAtOffset === h.selected_text) {
        isMatch = true;
      }
    }

    // 2. Exact text search in this chunk/paragraph
    if (!isMatch) {
      const foundIdx = paragraphText.indexOf(h.selected_text);
      if (foundIdx !== -1) {
        start = foundIdx;
        end = foundIdx + h.selected_text.length;
        isMatch = true;
      }
    }

    // 3. Trimmed / whitespace-tolerant search
    if (!isMatch) {
      const cleanSel = h.selected_text.trim();
      const foundClean = paragraphText.indexOf(cleanSel);
      if (foundClean !== -1) {
        start = foundClean;
        end = foundClean + cleanSel.length;
        isMatch = true;
      }
    }

    // CRITICAL: Only add if the text actually exists in this chunk/page!
    // Never highlight random offsets if text is on another page.
    if (isMatch && start >= 0 && end > start && start < paragraphText.length) {
      resolved.push({
        highlight: h,
        start,
        end: Math.min(end, paragraphText.length),
      });
    }
  }

  // Sort by start position
  resolved.sort((a, b) => a.start - b.start);

  const fragments: TextFragment[] = [];
  let currentPos = 0;

  for (const item of resolved) {
    // Skip if completely behind current pointer (overlapping)
    if (item.start < currentPos) {
      continue;
    }

    // Plain text before highlight
    if (item.start > currentPos) {
      fragments.push({
        text: paragraphText.slice(currentPos, item.start),
      });
    }

    // Highlighted text
    fragments.push({
      text: paragraphText.slice(item.start, item.end),
      highlight: item.highlight,
    });

    currentPos = item.end;
  }

  // Remaining text after last highlight
  if (currentPos < paragraphText.length) {
    fragments.push({
      text: paragraphText.slice(currentPos),
    });
  }

  return fragments;
}

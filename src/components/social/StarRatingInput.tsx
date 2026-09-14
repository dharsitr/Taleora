"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor · Disappointing prose",
  2: "Fair · Had promising ideas",
  3: "Enjoyable · Good reading",
  4: "Very Good · Highly recommended",
  5: "Masterpiece · Exceptional literary art",
};

export function StarRatingInput({
  value,
  onChange,
  size = "md",
  disabled = false,
}: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = React.useState<number | null>(null);

  const starSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const activeRating = hoverRating ?? value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= activeRating;

          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => !disabled && setHoverRating(star)}
              onMouseLeave={() => !disabled && setHoverRating(null)}
              className={cn(
                "p-1 rounded-md transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400",
                disabled && "cursor-not-allowed opacity-60"
              )}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <Star
                className={cn(
                  starSizes[size],
                  "transition-colors",
                  isFilled
                    ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                    : "text-muted-foreground/40 hover:text-amber-300"
                )}
              />
            </button>
          );
        })}
      </div>

      {activeRating > 0 && (
        <span className="text-xs font-serif text-amber-600 dark:text-amber-400 transition-opacity">
          {RATING_LABELS[activeRating] || `${activeRating} stars`}
        </span>
      )}
    </div>
  );
}

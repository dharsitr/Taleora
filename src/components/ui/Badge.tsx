import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "accent" | "warm";
}

export function Badge({
  className,
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors";

  const variants = {
    default: "bg-primary/15 text-primary border border-primary/20",
    secondary: "bg-secondary text-secondary-foreground border border-border/60",
    outline: "border border-border text-foreground/80",
    accent: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    warm: "bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700",
  };

  return (
    <span className={cn(base, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}

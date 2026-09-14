"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { addToLibrary, isInLibrary, removeFromLibrary } from "@/lib/books/queries";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LibraryActionButtonProps {
  bookId: string;
  bookTitle?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
  iconOnly?: boolean;
  onStatusChange?: (inLibrary: boolean) => void;
}

export function LibraryActionButton({
  bookId,
  variant = "default",
  size = "md",
  className,
  iconOnly = false,
  onStatusChange,
}: LibraryActionButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();

  const [inLibrary, setInLibrary] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [checkedBookId, setCheckedBookId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || !bookId) return;

    let isMounted = true;
    isInLibrary(user.id, bookId).then((res) => {
      if (isMounted) {
        setInLibrary(res);
        setCheckedBookId(bookId);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user, bookId]);

  const initialChecked = !user || checkedBookId === bookId;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (authLoading) return;

    if (!user) {
      // Prompt user to log in to save books to their personal library
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    const previousState = inLibrary;
    const nextState = !previousState;

    // Optimistic UI update
    setInLibrary(nextState);
    if (onStatusChange) onStatusChange(nextState);

    setLoading(true);
    try {
      if (nextState) {
        const success = await addToLibrary(user.id, bookId);
        if (!success) {
          setInLibrary(previousState);
          if (onStatusChange) onStatusChange(previousState);
        }
      } else {
        const success = await removeFromLibrary(user.id, bookId);
        if (!success) {
          setInLibrary(previousState);
          if (onStatusChange) onStatusChange(previousState);
        }
      }
    } catch (err) {
      console.error("Failed to update library status:", err);
      setInLibrary(previousState);
      if (onStatusChange) onStatusChange(previousState);
    } finally {
      setLoading(false);
    }
  };

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        title={
          !user
            ? "Sign in to add to your library"
            : inLibrary
            ? "Remove from Library"
            : "Add to Library"
        }
        aria-label={inLibrary ? "Remove from Library" : "Add to Library"}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xs transition-all duration-200 cursor-pointer",
          inLibrary
            ? "bg-primary text-primary-foreground shadow-sm hover:opacity-90"
            : "bg-black/40 hover:bg-black/60 text-white border border-white/20",
          className
        )}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Bookmark
            className={cn(
              "w-4 h-4 transition-transform active:scale-90",
              inLibrary ? "fill-current" : ""
            )}
          />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant={inLibrary ? "outline" : variant}
      size={size}
      disabled={loading || !initialChecked}
      onClick={handleToggle}
      className={cn(
        "gap-2 transition-all duration-200",
        inLibrary &&
          "border-primary/50 text-primary hover:bg-primary/10 hover:text-primary dark:border-primary/60",
        className
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : inLibrary ? (
        <>
          <Check className="w-4 h-4 text-primary" />
          <span>In Your Library</span>
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4" />
          <span>Add to Library</span>
        </>
      )}
    </Button>
  );
}

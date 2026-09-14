"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/use-auth";
import { getAuthorFollowStatus, toggleAuthorFollow } from "@/lib/social/queries";

interface AuthorFollowButtonProps {
  authorId: string;
  authorName?: string;
  initialFollowerCount?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AuthorFollowButton({
  authorId,
  authorName = "this author",
  initialFollowerCount = 0,
  size = "sm",
  className = "",
}: AuthorFollowButtonProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [isFollowing, setIsFollowing] = React.useState<boolean>(false);
  const [countDelta, setCountDelta] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(Boolean(user));
  const [isUpdating, setIsUpdating] = React.useState<boolean>(false);

  const followerCount = Math.max(0, initialFollowerCount + countDelta);

  // Load current follow status for logged-in user
  React.useEffect(() => {
    if (!user) return;

    let isMounted = true;
    getAuthorFollowStatus(authorId, user.id)
      .then((res) => {
        if (isMounted) {
          setIsFollowing(res.isFollowing);
          setCountDelta(res.followerCount - initialFollowerCount);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch author follow status:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authorId, user, initialFollowerCount]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (isUpdating) return;

    setIsUpdating(true);
    const previousState = isFollowing;

    // Optimistic update
    const nextState = !previousState;
    setIsFollowing(nextState);
    setCountDelta((prev) => prev + (nextState ? 1 : -1));

    try {
      const result = await toggleAuthorFollow(authorId, user.id);
      setIsFollowing(result.isFollowing);
      setCountDelta(result.followerCount - initialFollowerCount);
    } catch (err) {
      console.error("Failed to toggle author follow:", err);
      // Rollback on error
      setIsFollowing(previousState);
      setCountDelta((prev) => prev + (nextState ? -1 : 1));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button
      type="button"
      size={size}
      variant={isFollowing ? "outline" : "default"}
      onClick={handleToggle}
      disabled={isUpdating || isLoading}
      className={`gap-1.5 cursor-pointer font-medium transition-all ${
        isFollowing
          ? "border-primary/40 text-primary hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/40"
          : "shadow-xs"
      } ${className}`}
      title={isFollowing ? `Unfollow ${authorName}` : `Follow ${authorName}`}
      aria-label={isFollowing ? `Unfollow ${authorName}` : `Follow ${authorName}`}
    >
      {isUpdating ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-3.5 h-3.5 text-primary" />
      ) : (
        <UserPlus className="w-3.5 h-3.5" />
      )}
      <span>{isFollowing ? "Following" : "Follow"}</span>
      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-foreground/10 font-mono">
        {followerCount}
      </span>
    </Button>
  );
}

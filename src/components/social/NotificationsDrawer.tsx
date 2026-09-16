"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  CheckCheck,
  Heart,
  MessageSquare,
  BookOpen,
  Feather,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { NotificationRow, NotificationType } from "@/types/social";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/social/queries";
import { Button } from "@/components/ui/Button";
import { useWebSocketNotifications } from "@/lib/network/websocket-notifications";

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCountChange?: (unreadCount: number) => void;
}

export function NotificationsDrawer({
  isOpen,
  onClose,
  onCountChange,
}: NotificationsDrawerProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = React.useState<boolean>(false);

  const handleNotificationReceived = React.useCallback(
    (newNotif: NotificationRow) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        const updated = [newNotif, ...prev];
        const unread = updated.filter((n) => !n.is_read).length;
        onCountChange?.(unread);
        return updated;
      });
    },
    [onCountChange]
  );

  // Real-time WebSocket connection for live notification stream
  const { status: wsStatus } = useWebSocketNotifications({
    userId: user?.id,
    onNotificationReceived: handleNotificationReceived,
  });

  React.useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    getUserNotifications(user.id)
      .then((data) => {
        if (isMounted) {
          setNotifications(data);
          const unread = data.filter((n) => !n.is_read).length;
          onCountChange?.(unread);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user, onCountChange]);

  // Lock body scroll when drawer is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    if (!user || isMarkingAll) return;
    try {
      setIsMarkingAll(true);
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      onCountChange?.(0);
    } catch (err) {
      console.error("Failed to mark all notifications read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationRow) => {
    if (!user) return;
    if (!notification.is_read) {
      try {
        await markNotificationAsRead(notification.id, user.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        const remainingUnread = notifications.filter(
          (n) => !n.is_read && n.id !== notification.id
        ).length;
        onCountChange?.(remainingUnread);
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    onClose();

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case "review_like":
        return <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />;
      case "review_comment":
      case "book_comment":
        return <MessageSquare className="w-4 h-4 text-sky-500" />;
      case "author_new_chapter":
        return <BookOpen className="w-4 h-4 text-amber-500" />;
      case "author_follow":
        return <Feather className="w-4 h-4 text-emerald-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <aside
        className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-label="Activity Notifications"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-foreground">
                  Activity Notifications
                </h3>
                <span
                  className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full border ${
                    wsStatus === "connected"
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : wsStatus === "connecting"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}
                  title={`WebSocket Status: ${wsStatus}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      wsStatus === "connected"
                        ? "bg-emerald-500 animate-pulse"
                        : wsStatus === "connecting"
                        ? "bg-amber-500 animate-ping"
                        : "bg-muted-foreground"
                    }`}
                  />
                  <span>WS {wsStatus === "connected" ? "Live" : wsStatus}</span>
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Mark all as read"
              >
                {isMarkingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">Mark all read</span>
              </Button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-xs">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6 gap-3 text-muted-foreground">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground/60">
                <Bell className="w-6 h-6" />
              </div>
              <p className="font-serif font-bold text-foreground text-sm">
                No notifications yet
              </p>
              <p className="text-xs max-w-xs leading-relaxed">
                When readers like your reviews, join discussions, or authors publish new chapters, you&apos;ll see updates here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                  notification.is_read
                    ? "bg-secondary/15 border-border/50 hover:bg-secondary/35 text-foreground/80"
                    : "bg-primary/[0.04] border-primary/25 hover:bg-primary/[0.08] text-foreground ring-1 ring-primary/10"
                }`}
              >
                {/* Icon */}
                <div className="w-8 h-8 rounded-lg bg-card border border-border/60 flex items-center justify-center shrink-0 shadow-2xs">
                  {getIconForType(notification.type as NotificationType)}
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-semibold text-xs text-foreground truncate">
                      {notification.title}
                    </h5>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 self-center" />
                )}
              </div>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}

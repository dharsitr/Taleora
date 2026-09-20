"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  Heart,
  MessageSquare,
  BookOpen,
  Feather,
  Sparkles,
  ShieldAlert,
  Loader2,
  ExternalLink,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { NotificationRow, NotificationType } from "@/types/social";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
} from "@/lib/social/queries";
import { useWebSocketNotifications } from "@/lib/network/websocket-notifications";

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isMarkingAll, setIsMarkingAll] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle incoming live notification from WebSocket
  const handleNotificationReceived = React.useCallback((newNotif: NotificationRow) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev];
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

  // Real-time WebSocket connection for live notification stream
  const { status: wsStatus } = useWebSocketNotifications({
    userId: user?.id,
    onNotificationReceived: handleNotificationReceived,
  });

  // Load initial unread count on mount
  React.useEffect(() => {
    if (!user) return;
    let isMounted = true;
    getUnreadNotificationCount(user.id)
      .then((count) => {
        if (isMounted) setUnreadCount(count);
      })
      .catch((err) => console.error("Failed to fetch unread count:", err));

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Load full notification list when popover opens
  React.useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    setIsLoading(true);
    getUserNotifications(user.id)
      .then((data) => {
        if (isMounted) {
          setNotifications(data);
          const unread = data.filter((n) => !n.is_read).length;
          setUnreadCount(unread);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  // Close popover when clicking outside or pressing Escape
  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationRow) => {
    if (!notification.is_read && user) {
      try {
        await markNotificationAsRead(notification.id, user.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    setIsOpen(false);

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const getIconForType = (type: NotificationType | string) => {
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
        if (type.startsWith("security")) {
          return <ShieldAlert className="w-4 h-4 text-amber-500" />;
        }
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={
          unreadCount > 0
            ? `Activity notifications (${unreadCount} unread)`
            : "Activity notifications"
        }
        className={`relative flex items-center justify-center w-9 h-9 rounded-lg border transition-colors cursor-pointer ${
          isOpen
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card hover:bg-secondary text-muted-foreground hover:text-foreground"
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[32rem] overflow-hidden"
          role="dialog"
          aria-label="Activity Notifications"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-border bg-secondary/30 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-serif text-sm font-bold text-foreground">
                    Notifications
                  </h4>
                  {/* Realtime WebSocket status pill */}
                  <span
                    className={`flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                      wsStatus === "connected"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                    title={`Realtime Status: ${wsStatus}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        wsStatus === "connected" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      }`}
                    />
                    <span>{wsStatus === "connected" ? "Live" : wsStatus}</span>
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? "s" : ""}` : "All caught up"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
                aria-label="Close notifications"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List Body with dedicated scroll */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 divide-y divide-border/20 max-h-80">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-xs">Fetching updates...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center px-4 gap-2 text-muted-foreground">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground/60">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="font-serif font-bold text-foreground text-xs">
                  No notifications yet
                </p>
                <p className="text-[11px] leading-relaxed max-w-xs">
                  When authors release new chapters or readers react to your reviews, alerts will appear right here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer flex gap-3 pt-3 first:pt-2.5 ${
                    notification.is_read
                      ? "bg-transparent border-transparent hover:bg-secondary/40 text-foreground/80"
                      : "bg-primary/[0.04] border-primary/20 hover:bg-primary/[0.08] text-foreground ring-1 ring-primary/10"
                  }`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-lg bg-card border border-border/70 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {getIconForType(notification.type)}
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col gap-0.5 min-w-0">
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

          {/* Footer */}
          <div className="p-2.5 border-t border-border bg-secondary/20 flex items-center justify-between text-xs shrink-0">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="w-full py-1.5 px-3 rounded-lg text-center font-medium text-xs text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

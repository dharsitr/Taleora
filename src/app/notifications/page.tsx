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
  Inbox,
  ArrowRight,
  WifiOff,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/lib/auth/use-auth";
import { NotificationRow, NotificationType } from "@/types/social";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/social/queries";
import { useWebSocketNotifications } from "@/lib/network/websocket-notifications";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isMarkingAll, setIsMarkingAll] = React.useState<boolean>(false);
  const [isOffline, setIsOffline] = React.useState<boolean>(false);

  // Monitor network status
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const handleNotificationReceived = React.useCallback((newNotif: NotificationRow) => {
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotif.id)) return prev;
      return [newNotif, ...prev];
    });
  }, []);

  const { status: wsStatus } = useWebSocketNotifications({
    userId: user?.id,
    onNotificationReceived: handleNotificationReceived,
  });

  const loadNotifications = React.useCallback(async () => {
    if (!user) {
      if (!authLoading) setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getUserNotifications(user.id);
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  React.useEffect(() => {
    if (!authLoading) {
      loadNotifications();
    }
  }, [authLoading, loadNotifications]);

  const handleMarkAllRead = async () => {
    if (!user || isMarkingAll) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
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
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const formatTimeAgo = (dateStr?: string | null) => {
    if (!dateStr) return "Recently";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Recently";
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMin < 1) return "Just now";
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const getIconForType = (type?: NotificationType | string | null) => {
    switch (type) {
      case "review_like":
        return <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />;
      case "review_comment":
      case "book_comment":
        return <MessageSquare className="w-5 h-5 text-sky-400" />;
      case "author_new_chapter":
        return <BookOpen className="w-5 h-5 text-amber-400" />;
      case "author_follow":
        return <Feather className="w-5 h-5 text-emerald-400" />;
      default:
        if (typeof type === "string" && type.startsWith("security")) {
          return <ShieldAlert className="w-5 h-5 text-amber-400" />;
        }
        return <Sparkles className="w-5 h-5 text-amber-400" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <div className="relative flex flex-col gap-8 max-w-4xl mx-auto w-full pb-20">
      {/* Background Ambient Warm Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-80 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Page Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/25 bg-card/85 p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400">
              <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="font-mono text-[11px] tracking-widest">Chronicle & Activity</span>
              <span
                className={cn(
                  "ml-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full border",
                  isOffline
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                    : wsStatus === "connected"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-stone-900 text-stone-400 border-stone-800"
                )}
              >
                ● {isOffline ? "Offline Mode" : wsStatus === "connected" ? "Live Feed" : wsStatus}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Activity & Notifications
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Updates on story releases, reader reactions, author publications, and security alerts.
            </p>
          </div>

          {unreadCount > 0 && !isOffline && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll}
              className="self-start sm:self-center gap-1.5 text-xs shrink-0 border-amber-500/30 hover:border-amber-400 text-amber-300 bg-stone-950/60"
            >
              {isMarkingAll ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              <span>Mark all read</span>
            </Button>
          )}
        </div>
      </div>

      {/* Offline Notice Banner if offline */}
      {isOffline && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-amber-500/30 bg-stone-950/80 text-xs shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <WifiOff className="w-4 h-4" />
            </div>
            <div>
              <p className="font-serif font-bold text-foreground">Offline Sanctuary Active</p>
              <p className="text-muted-foreground">
                You are currently disconnected from the internet. Fresh notifications will stream once back online.
              </p>
            </div>
          </div>
          <Link href="/offline">
            <Button size="sm" variant="outline" className="text-xs border-amber-500/30 text-amber-400">
              Offline Stories
            </Button>
          </Link>
        </div>
      )}

      {/* Segmented Tab Dock */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-900/60 dark:bg-stone-950/70 border border-border/60 self-start backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
            activeTab === "all"
              ? "bg-amber-500 text-stone-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "text-muted-foreground hover:text-amber-300 hover:bg-white/5"
          )}
        >
          All Updates ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={cn(
            "px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer",
            activeTab === "unread"
              ? "bg-amber-500 text-stone-950 font-bold shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              : "text-muted-foreground hover:text-amber-300 hover:bg-white/5"
          )}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Content Stream */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-sm font-mono text-muted-foreground">Consulting the archives...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-3xl border border-dashed border-amber-500/25 bg-card/60 gap-3 shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-foreground">
            {activeTab === "unread" ? "No unread alerts" : "No activity recorded yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            {activeTab === "unread"
              ? "You are completely caught up on reading milestones and community alerts."
              : "When authors publish new chapters or readers react to your reviews, alerts will appear right here."}
          </p>
          <Link href="/discover" className="mt-2">
            <Button size="sm" className="gap-1.5 text-xs bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold border-none">
              <span>Browse Stories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={cn(
                "group relative p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 shadow-sm",
                notification.is_read
                  ? "bg-card/70 border-border/60 hover:bg-card hover:border-amber-500/30 text-foreground/85"
                  : "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10 text-foreground shadow-[0_0_15px_rgba(245,158,11,0.1)] ring-1 ring-amber-500/20"
              )}
            >
              {/* Icon Container */}
              <div className="w-10 h-10 rounded-xl bg-stone-950/80 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                {getIconForType(notification.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif font-bold text-sm text-foreground">
                    {notification.title}
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {notification.message}
                </p>
              </div>

              {/* Unread indicator */}
              {!notification.is_read && (
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

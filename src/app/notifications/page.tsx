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

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [activeTab, setActiveTab] = React.useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [isMarkingAll, setIsMarkingAll] = React.useState<boolean>(false);

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
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await getUserNotifications(user.id);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const getIconForType = (type: NotificationType | string) => {
    switch (type) {
      case "review_like":
        return <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />;
      case "review_comment":
      case "book_comment":
        return <MessageSquare className="w-5 h-5 text-sky-500" />;
      case "author_new_chapter":
        return <BookOpen className="w-5 h-5 text-amber-500" />;
      case "author_follow":
        return <Feather className="w-5 h-5 text-emerald-500" />;
      default:
        if (type.startsWith("security")) {
          return <ShieldAlert className="w-5 h-5 text-amber-500" />;
        }
        return <Sparkles className="w-5 h-5 text-primary" />;
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold tracking-wider uppercase">
            <Bell className="w-4 h-4" />
            <span>Activity Feed</span>
            <span
              className={`ml-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                wsStatus === "connected"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              ● {wsStatus === "connected" ? "Live Stream" : wsStatus}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Activity & Notifications
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Updates on story reactions, author publications, community interactions, and account security.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="self-start sm:self-center gap-1.5 text-xs shrink-0"
          >
            {isMarkingAll ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCheck className="w-3.5 h-3.5" />
            )}
            <span>Mark all as read</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "all"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          All Updates ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("unread")}
          className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === "unread"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Loading your activity updates...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-border bg-card/40 gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-base font-bold text-foreground">
            {activeTab === "unread" ? "No unread notifications" : "No notifications yet"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
            {activeTab === "unread"
              ? "You are all caught up on your reading and community updates!"
              : "When authors publish new chapters or readers react to your reviews, they will appear here."}
          </p>
          <Link href="/discover" className="mt-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <span>Browse Stories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-4 ${
                notification.is_read
                  ? "bg-card/40 border-border/60 hover:bg-secondary/40 text-foreground/80"
                  : "bg-primary/[0.04] border-primary/25 hover:bg-primary/[0.08] text-foreground ring-1 ring-primary/10 shadow-2xs"
              }`}
            >
              {/* Icon Container */}
              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                {getIconForType(notification.type)}
              </div>

              {/* Message Details */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm text-foreground">
                    {notification.title}
                  </h4>
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                    {formatTimeAgo(notification.created_at)}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {notification.message}
                </p>
              </div>

              {/* Unread indicator */}
              {!notification.is_read && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 self-center" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

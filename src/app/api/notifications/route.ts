/**
 * REST API: /api/notifications
 * GET: Fetch authenticated user's notifications.
 * POST: Mark notifications as read for current user.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withNetworkTelemetry } from "@/lib/network/telemetry";
import { enforceRateLimit } from "@/lib/network/rate-limiter";

// GET /api/notifications
export async function GET(req: NextRequest) {
  return withNetworkTelemetry(req, async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateCheck = enforceRateLimit(req, "publicRead", user.id);
    if (!rateCheck.allowed) return rateCheck.response;

    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const unreadCount = (notifications || []).filter((n) => !n.is_read).length;

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount,
    });
  });
}

// POST /api/notifications (mark as read)
export async function POST(req: NextRequest) {
  return withNetworkTelemetry(req, async () => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateCheck = enforceRateLimit(req, "publicRead", user.id);
    if (!rateCheck.allowed) return rateCheck.response;

    let body: { notificationId?: string; markAll?: boolean } = {};
    try {
      body = await req.json();
    } catch {
      body = { markAll: true };
    }

    if (body.notificationId) {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", body.notificationId)
        .eq("user_id", user.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Notifications updated" });
  });
}

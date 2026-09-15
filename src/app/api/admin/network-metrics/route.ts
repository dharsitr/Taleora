/**
 * REST API: /api/admin/network-metrics
 * Strict Admin Authorization: Only accessible to user with role === 'admin'.
 * GET: Return real-time network telemetry snapshot (latency, throughput, active connections, errors, request logs).
 * POST: Reset network metrics counters.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { networkTelemetry, withNetworkTelemetry } from "@/lib/network/telemetry";

async function verifyStrictAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, status: 401, error: "Authentication required" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, role, is_suspended")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { authorized: false, status: 403, error: "User profile not found" };
  }

  if (profile.is_suspended) {
    return { authorized: false, status: 403, error: "Account suspended" };
  }

  // Strict check: Must have 'admin' role
  if (profile.role !== "admin") {
    return {
      authorized: false,
      status: 403,
      error: "Forbidden: Only administrators may inspect network metrics.",
    };
  }

  return { authorized: true, user, profile };
}

// GET /api/admin/network-metrics
export async function GET(req: NextRequest) {
  return withNetworkTelemetry(req, async () => {
    const auth = await verifyStrictAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const metrics = networkTelemetry.getSnapshot();
    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  });
}

// POST /api/admin/network-metrics (reset counters)
export async function POST(req: NextRequest) {
  return withNetworkTelemetry(req, async () => {
    const auth = await verifyStrictAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    networkTelemetry.reset();
    return NextResponse.json({
      success: true,
      message: "Network telemetry counters successfully reset.",
    });
  });
}

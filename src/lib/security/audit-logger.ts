import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export type SecurityAuditEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_MFA_CHALLENGE"
  | "AUTH_LOGOUT"
  | "BOOK_CREATE"
  | "BOOK_UPDATE"
  | "BOOK_DELETE"
  | "CHAPTER_CREATE"
  | "CHAPTER_PUBLISH"
  | "CHAPTER_DELETE"
  | "ROLE_UPGRADE"
  | "USER_SUSPEND"
  | "USER_UNSUSPEND"
  | "REPORT_CREATE"
  | "REPORT_RESOLVE"
  | "RATE_LIMIT_TRIGGERED"
  | "ADMIN_ACTION";

export interface SecurityAuditEntry {
  actorId?: string | null;
  action: SecurityAuditEventType;
  targetType?: string;
  targetId?: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Asynchronously logs high-value security events to the immutable audit_logs database table.
 * Designed to never throw or interrupt customer transactions (fail-safe).
 */
export async function logSecurityAuditEvent(entry: SecurityAuditEntry): Promise<void> {
  const timestamp = new Date().toISOString();

  // Structured security log for log aggregators (e.g. Datadog, CloudWatch, Papertrail)
  const structuredLog = {
    level: "AUDIT",
    timestamp,
    ...entry,
  };

  if (process.env.NODE_ENV !== "test") {
    console.info(`[AUDIT_LOG] ${JSON.stringify(structuredLog)}`);
  }

  // Persist to Postgres database if running in a server context
  try {
    const supabase = await createClient();
    await supabase.from("audit_logs").insert({
      actor_id: entry.actorId || null,
      action: entry.action,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent ? entry.userAgent.slice(0, 500) : null,
      metadata: (entry.metadata as unknown as Json) || {},
      created_at: timestamp,
    });
  } catch (err) {
    // Audit write failures should be logged to stderr but never break caller logic
    console.warn("[AUDIT_LOG_WRITE_WARNING] Failed to write audit event to database:", err);
  }
}

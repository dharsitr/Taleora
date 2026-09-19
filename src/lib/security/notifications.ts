import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database.types";

export type SecurityEventType =
  | "mfa_enrolled"
  | "mfa_removed"
  | "password_changed"
  | "email_updated"
  | "admin_elevated"
  | "suspicious_attempt";

interface SecurityNotificationDetails {
  title: string;
  message: string;
  link: string;
}

const SECURITY_MESSAGES: Record<SecurityEventType, SecurityNotificationDetails> = {
  mfa_enrolled: {
    title: "Security: Two-Factor Authentication Enabled",
    message: "Two-Factor Authentication (TOTP) has been successfully activated on your Taleora account.",
    link: "/settings",
  },
  mfa_removed: {
    title: "Security: Two-Factor Authentication Disabled",
    message: "Two-Factor Authentication (TOTP) was removed from your account. If this was not you, please secure your account immediately.",
    link: "/settings",
  },
  password_changed: {
    title: "Security: Account Password Changed",
    message: "Your account password was successfully updated. If you did not make this change, please reset your password immediately.",
    link: "/settings",
  },
  email_updated: {
    title: "Security: Email Address Updated",
    message: "The email address associated with your Taleora account was modified.",
    link: "/settings",
  },
  admin_elevated: {
    title: "Security: Administrative Session Verified",
    message: "An administrative access session was verified via Two-Factor Authentication (AAL2).",
    link: "/admin",
  },
  suspicious_attempt: {
    title: "Security: Unusual Authentication Activity",
    message: "Multiple authentication attempts were detected on your account. Your account security remains active.",
    link: "/settings",
  },
};

/**
 * Creates a security notification for sensitive account events without exposing confidential tokens.
 */
export async function createSecurityNotification(
  supabase: SupabaseClient<Database>,
  userId: string,
  event: SecurityEventType
): Promise<boolean> {
  const details = SECURITY_MESSAGES[event];
  if (!details || !userId) return false;

  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type: `security_${event}`,
      title: details.title,
      message: details.message,
      link: details.link,
      actor_id: null,
    });

    if (error) {
      console.warn("[SecurityNotification] Non-fatal notification error:", error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn("[SecurityNotification] Failed to create notification:", err);
    return false;
  }
}

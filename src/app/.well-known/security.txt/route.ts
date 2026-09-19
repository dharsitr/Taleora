import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * RFC 9116 - A File Format to Aid in Security Vulnerability Disclosure
 * Serves /.well-known/security.txt with standard directives.
 */
export async function GET() {
  const contactEmail = process.env.SECURITY_CONTACT_EMAIL || "security@taleora.app";
  const appUrl = env.appUrl.replace(/\/$/, "");
  
  // RFC 9116 requires an explicit future expiration date in ISO 8601 / RFC 3339 format
  const expiresDate = new Date();
  expiresDate.setFullYear(expiresDate.getFullYear() + 1);
  const expires = expiresDate.toISOString();

  const securityTxt = [
    `# Taleora Security Vulnerability Disclosure Policy (RFC 9116)`,
    `Contact: mailto:${contactEmail}`,
    `Expires: ${expires}`,
    `Preferred-Languages: en`,
    `Canonical: ${appUrl}/.well-known/security.txt`,
    `Policy: ${appUrl}/README.md`,
    `Acknowledgments: ${appUrl}/SECURITY_AUDIT.md`,
  ].join("\n") + "\n";

  return new NextResponse(securityTxt, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database.types";
import { env } from "@/lib/env";
import { validateSafeRedirect } from "@/lib/security/validation";
import { RateLimitProfiles } from "@/lib/security/rate-limit";

/**
 * Updates the user session and handles route protection.
 * Employs supabase.auth.getUser() to strictly validate the token with Supabase Auth.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown-client";

  // 1. Rate limiting on sensitive endpoints
  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-email",
  ];
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthRoute && request.method === "POST") {
    const authLimit = RateLimitProfiles.auth(ip);
    if (!authLimit.success) {
      return new NextResponse(
        JSON.stringify({ error: "Too many authentication attempts. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }
  }

  const supabase = createServerClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Validate the user's authentic session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin and Moderation workspace routes
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_suspended")
      .eq("id", user.id)
      .single();

    if (!profile || profile.is_suspended || !["admin", "moderator"].includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    // Require AAL2 MFA for Admin & Moderator workspace
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.currentLevel !== "aal2") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/mfa-challenge";
      url.searchParams.set("next", pathname);
      // If admin hasn't enrolled yet, prompt setup mode rather than locking out
      if (aalData?.nextLevel !== "aal2") {
        url.searchParams.set("setup", "true");
      }
      return NextResponse.redirect(url);
    }
  }

  // Protected paths that require authentication
  const protectedRoutes = [
    "/library",
    "/bookmarks",
    "/settings",
    "/studio",
    "/auth/mfa-challenge",
    "/notifications",
    "/goals",
    "/books",
    "/read",
  ];
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If unauthenticated user tries to visit a protected route, redirect to /login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    if (pathname.startsWith("/books") || pathname.startsWith("/read")) {
      url.searchParams.set("notice", "Please sign in to explore books");
    } else if (pathname === "/goals" || pathname.startsWith("/goals/")) {
      url.searchParams.set("notice", "Sign in to view your reading goals");
    }
    return NextResponse.redirect(url);
  }

  // If suspended user tries to access /studio, deny publishing access
  if (user && (pathname === "/studio" || pathname.startsWith("/studio/"))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_suspended")
      .eq("id", user.id)
      .single();

    if (profile?.is_suspended) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("notice", "suspended");
      return NextResponse.redirect(url);
    }
  }

  // If already authenticated user visits login or signup, redirect to /library or safe next
  if (user && isAuthRoute) {
    const nextParam = request.nextUrl.searchParams.get("next");
    const redirectUrl = validateSafeRedirect(nextParam, "/library");
    const url = request.nextUrl.clone();
    url.pathname = redirectUrl;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

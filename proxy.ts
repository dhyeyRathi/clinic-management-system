import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Define paths that do not require authentication
const PUBLIC_PREFIXES = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/api/auth",
  "/images"
];

const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password"
];

// Map roles to their specific dashboard URL paths
const ROLE_DASHBOARDS: Record<string, string> = {
  CLIENT: "/client",
  DOCTOR: "/doctor",
  RECEPTIONIST: "/receptionist",
  LAB_MANAGER: "/lab-manager",
  MANAGER: "/manager"
};

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.pathname;

  // 1. Let public assets pass immediately
  const isAsset = PUBLIC_PREFIXES.some(prefix => url.startsWith(prefix));
  if (isAsset) {
    return NextResponse.next();
  }

  const isAuthPage = AUTH_PAGES.some(page => url.startsWith(page));

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // User is NOT logged in
    if (!user) {
      if (isAuthPage || url === "/") {
        return NextResponse.next();
      }
      // Redirect protected paths to /login
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // User IS logged in, fetch their role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "CLIENT";
    const userDashboard = ROLE_DASHBOARDS[role] || "/client";

    // If user is on an auth page (login/register), redirect to their dashboard
    if (isAuthPage) {
      if (url.startsWith("/reset-password")) {
        return NextResponse.next();
      }
      const dashboardUrl = new URL(userDashboard, request.url);
      return NextResponse.redirect(dashboardUrl);
    }

    // Role-based Path Protection:
    // e.g. A CLIENT should not access /doctor or /manager paths
    const rolePaths = Object.values(ROLE_DASHBOARDS);
    const targetRolePrefix = rolePaths.find(prefix => url.startsWith(prefix));

    if (targetRolePrefix && targetRolePrefix !== userDashboard) {
      // Trying to access another role's dashboard path -> Redirect to their own dashboard
      const dashboardUrl = new URL(userDashboard, request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  } catch (error) {
    console.error("Session verification in proxy failed:", error);
    // On error, let the request proceed to prevent lockouts, or redirect to login if not public
    if (!isAuthPage && url !== "/") {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
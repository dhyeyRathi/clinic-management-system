import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Define paths that do not require authentication
const PUBLIC_PREFIXES = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/favicon.png",
  "/icon.png",
  "/api/auth",
  "/images",
  "/about",
  "/doctors",
  "/sitemap.xml",
  "/robots.txt",
  "/llms.txt",
  "/ai.txt"
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

export async function proxy
  (request: NextRequest) {
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
      // Return a 403 Forbidden response instead of redirecting or throwing 404
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>403 Forbidden</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { background: #f8fafc; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .container { text-align: center; padding: 2.5rem; border-radius: 1.5rem; background: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; max-width: 420px; }
            .icon { font-size: 3.5rem; margin-bottom: 1rem; }
            h1 { font-size: 2.5rem; margin: 0; color: #ef4444; font-weight: 800; letter-spacing: -0.05em; }
            h2 { font-size: 1.25rem; margin-top: 0.5rem; margin-bottom: 0.75rem; color: #1e293b; font-weight: 700; }
            p { color: #64748b; font-size: 0.875rem; line-height: 1.5; margin-bottom: 1.75rem; }
            a { display: inline-block; background: #3b82f6; color: white; padding: 0.75rem 1.5rem; border-radius: 0.75rem; text-decoration: none; font-weight: 600; font-size: 0.875rem; transition: background 0.2s; }
            a:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🚫</div>
            <h1>403</h1>
            <h2>Access Forbidden</h2>
            <p>You do not have the required role permissions to view this dashboard page.</p>
            <a href="${userDashboard}">Go to Your Dashboard</a>
          </div>
        </body>
        </html>`,
        {
          status: 403,
          headers: { "Content-Type": "text/html" },
        }
      );
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
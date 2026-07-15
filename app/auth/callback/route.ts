import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next) {
        const targetUrl = next === "/reset-password" ? "/reset-password?flow=recovery" : next;
        return NextResponse.redirect(`${origin}${targetUrl}`);
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role || "CLIENT";
        const dashboards: Record<string, string> = {
          CLIENT: "/client",
          DOCTOR: "/doctor",
          RECEPTIONIST: "/receptionist",
          LAB_MANAGER: "/lab-manager",
          MANAGER: "/manager"
        };
        const targetPath = dashboards[role] || "/client";
        return NextResponse.redirect(`${origin}${targetPath}`);
      }
    }
  }

  // Return the user to login page if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        const role = profile?.role || "PATIENT";
        const dashboards: Record<string, string> = {
          PATIENT: "/patient",
          DOCTOR: "/doctor",
          RECEPTIONIST: "/receptionist",
          LAB_MANAGER: "/lab-manager",
          MANAGER: "/manager"
        };
        const targetPath = dashboards[role] || "/patient";
        return NextResponse.redirect(`${origin}${targetPath}`);
      }
    }
  }

  // Return the user to login page if code exchange fails
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}

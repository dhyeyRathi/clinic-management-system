import { NextResponse } from "next/server";
import { getAllUsers } from "@/lib/services/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify role (Only MANAGER can fetch all users)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Manager access required" }, { status: 403 });
    }

    const users = await getAllUsers();
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}

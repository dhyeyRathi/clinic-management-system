import { NextRequest, NextResponse } from "next/server";
import { getUserProfile, updateUserProfile, deleteUser } from "@/lib/services/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify authorization: Users can view their own profile; staff / manager / doctor can view any
    if (user.id !== id) {
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const allowedRoles = ["MANAGER", "RECEPTIONIST", "DOCTOR", "LAB_MANAGER"];
      if (!currentUserProfile || !allowedRoles.includes(currentUserProfile.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const profile = await getUserProfile(id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify authorization: Users can update their own profile; managers can update any
    if (user.id !== id) {
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!currentUserProfile || currentUserProfile.role !== "MANAGER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json();
    const { baseData, roleSpecificData } = body;

    const result = await updateUserProfile(id, baseData || {}, roleSpecificData);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify authorization: Only MANAGER can disable/delete users
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!currentUserProfile || currentUserProfile.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Manager access required" }, { status: 403 });
    }

    const result = await deleteUser(id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}

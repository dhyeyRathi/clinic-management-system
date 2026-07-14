import { NextRequest, NextResponse } from "next/server";
import { getAllDoctors, createDoctorProfile } from "@/lib/services/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication (any authenticated user can view the list of doctors)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctors = await getAllDoctors();
    return NextResponse.json(doctors);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    // Verify authorization: Only MANAGER can create doctor profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden: Manager access required" }, { status: 403 });
    }

    const body = await request.json();
    const {
      user_id,
      doctor_code,
      specialization,
      qualifications,
      availability,
      consultation_fee,
    } = body;

    const doctorProfile = await createDoctorProfile({
      user_id,
      doctor_code,
      specialization,
      qualifications,
      availability,
      consultation_fee,
    });

    return NextResponse.json(doctorProfile, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}

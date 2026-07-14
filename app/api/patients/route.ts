import { NextRequest, NextResponse } from "next/server";
import { getAllPatients, createPatientProfile } from "@/lib/services/profiles";
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

    // Verify authorization: Staff, Managers, and Doctors can see patient lists
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["MANAGER", "RECEPTIONIST", "DOCTOR", "LAB_MANAGER"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: Unauthorized access scope" }, { status: 403 });
    }

    const patients = await getAllPatients();
    return NextResponse.json(patients);
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

    const body = await request.json();
    const {
      user_id,
      patient_code,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      medical_notes_summary,
    } = body;

    // Verify authorization: Staff / Manager can create for anyone; Patient can only create for their own user_id
    if (user.id !== user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const allowedRoles = ["MANAGER", "RECEPTIONIST"];
      if (!profile || !allowedRoles.includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden: Unauthorized access scope" }, { status: 403 });
      }
    }

    const patientProfile = await createPatientProfile({
      user_id,
      patient_code,
      date_of_birth,
      gender,
      address,
      emergency_contact,
      medical_notes_summary,
    });

    return NextResponse.json(patientProfile, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "An unexpected error occurred" }, { status: 500 });
  }
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DoctorPatientsClient from "./components/DoctorPatientsClient";

export default async function DoctorPatientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get doctor's profile ID
  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!doctorProfile) {
    return (
      <div className="p-6 text-center text-muted">
        Doctor profile details not found.
      </div>
    );
  }

  // Fetch all unique clients who have had at least one appointment with this doctor
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      client_id,
      client_profiles (
        id,
        client_code,
        date_of_birth,
        gender,
        address,
        emergency_contact,
        medical_notes_summary,
        profiles (
          name,
          email,
          phone,
          avatar_url
        )
      )
    `)
    .eq("doctor_id", doctorProfile.id);

  // Group by client to avoid duplicates
  const clientMap = new Map<string, any>();
  (appointments || []).forEach((app: any) => {
    const cp = app.client_profiles;
    const clientInfo = Array.isArray(cp) ? cp[0] : cp;
    if (clientInfo && !clientMap.has(clientInfo.id)) {
      const profile = Array.isArray(clientInfo.profiles) ? clientInfo.profiles[0] : clientInfo.profiles;
      clientMap.set(clientInfo.id, {
        id: clientInfo.id,
        client_code: clientInfo.client_code,
        date_of_birth: clientInfo.date_of_birth,
        gender: clientInfo.gender,
        address: clientInfo.address,
        emergency_contact: clientInfo.emergency_contact,
        medical_notes_summary: clientInfo.medical_notes_summary,
        name: profile?.name || "Unknown Patient",
        email: profile?.email || "",
        phone: profile?.phone || "",
        avatar_url: profile?.avatar_url || null,
      });
    }
  });

  const uniquePatients = Array.from(clientMap.values());

  // Fetch reports for all these patients so doctors can view them (read-only)
  const patientIds = uniquePatients.map((p) => p.id);
  let reports: any[] = [];
  if (patientIds.length > 0) {
    const { data: reportsData } = await supabase
      .from("reports")
      .select(`
        id,
        client_id,
        title,
        description,
        file_url,
        created_at,
        doctor_profiles (
          profiles (
            name
          )
        )
      `)
      .in("client_id", patientIds);
    reports = reportsData || [];
  }

  // Format reports doctor name mapping
  const formattedReports = reports.map((rep: any) => {
    const docProfile = Array.isArray(rep.doctor_profiles)
      ? rep.doctor_profiles[0]
      : rep.doctor_profiles;

    const innerProfile = docProfile
      ? (Array.isArray(docProfile.profiles) ? docProfile.profiles[0] : docProfile.profiles)
      : null;

    return {
      id: rep.id,
      client_id: rep.client_id,
      title: rep.title,
      description: rep.description,
      file_url: rep.file_url,
      created_at: rep.created_at,
      doctor_name: innerProfile?.name ? `Dr. ${innerProfile.name}` : "Clinic Staff",
    };
  });

  // Fetch past completed appointments (which act as prescriptions / clinical records)
  let pastVisits: any[] = [];
  if (patientIds.length > 0) {
    const { data: visits } = await supabase
      .from("appointments")
      .select(`
        id,
        client_id,
        scheduled_at,
        reason,
        notes,
        status,
        doctor_profiles (
          profiles (
            name
          )
        )
      `)
      .in("client_id", patientIds)
      .eq("status", "COMPLETED")
      .order("scheduled_at", { ascending: false });
    pastVisits = visits || [];
  }

  const formattedVisits = pastVisits.map((v: any) => {
    const docProfile = Array.isArray(v.doctor_profiles)
      ? v.doctor_profiles[0]
      : v.doctor_profiles;

    const innerProfile = docProfile
      ? (Array.isArray(docProfile.profiles) ? docProfile.profiles[0] : docProfile.profiles)
      : null;

    return {
      id: v.id,
      client_id: v.client_id,
      scheduled_at: v.scheduled_at,
      reason: v.reason,
      notes: v.notes,
      doctor_name: innerProfile?.name ? `Dr. ${innerProfile.name}` : "Unknown Doctor",
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">My Patients</h1>
        <p className="text-muted text-sm mt-1">
          View demographics, clinical history, past reports and prescriptions for patients under your care.
        </p>
      </div>

      <DoctorPatientsClient
        patients={uniquePatients}
        reports={formattedReports}
        visits={formattedVisits}
      />
    </div>
  );
}

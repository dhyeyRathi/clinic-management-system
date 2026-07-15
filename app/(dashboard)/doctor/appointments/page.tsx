import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DoctorAppointmentsClient from "./components/DoctorAppointmentsClient";

export default async function AppointmentsPage() {
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

  // Fetch doctor's assigned appointments with client details
  const { data: appointments } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      status,
      reason,
      mode,
      notes,
      client_profiles (
        id,
        client_code,
        profiles (
          name,
          email,
          avatar_url
        )
      )
    `)
    .eq("doctor_id", doctorProfile.id)
    .order("scheduled_at", { ascending: false });

  // Format appointments client profile data safely
  const formattedAppointments = (appointments || []).map((app: any) => {
    const clientProfile = app.client_profiles;
    const clientInfo = Array.isArray(clientProfile) ? clientProfile[0] : clientProfile;
    const clientUser = clientInfo?.profiles;
    const innerClientUser = Array.isArray(clientUser) ? clientUser[0] : clientUser;

    return {
      id: app.id,
      scheduled_at: app.scheduled_at,
      status: app.status,
      reason: app.reason,
      mode: app.mode,
      notes: app.notes,
      client: {
        id: clientInfo?.id || "",
        client_code: clientInfo?.client_code || "Unknown MRN",
        name: innerClientUser?.name || "Unknown Patient",
        email: innerClientUser?.email || "",
        avatar_url: innerClientUser?.avatar_url || null,
      },
    };
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-heading">Consultation Console</h1>
        <p className="text-muted text-sm mt-1">
          Review patient visits, mark patient check-ins, record diagnosis notes, and close consults.
        </p>
      </div>

      <DoctorAppointmentsClient initialAppointments={formattedAppointments} />
    </div>
  );
}
